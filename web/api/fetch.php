<?php
// PHP proxy for /api/fetch (hardened).
header('Cache-Control: no-store');
require __DIR__ . '/rate-limit.php';

if (!nv_rate_limit('fetch', 30, 60)) nv_reject_rate_limited(60);

$url = isset($_GET['url']) ? trim($_GET['url']) : '';
if (!preg_match('#^https?://#i', $url)) {
  http_response_code(400);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Invalid url';
  exit;
}

$parts = parse_url($url);
if ($parts === false || empty($parts['host'])) {
  http_response_code(400);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Invalid url';
  exit;
}

$host = $parts['host'];
$lowerHost = strtolower($host);
$forbid = function ($reason = 'Forbidden host') {
  http_response_code(403);
  header('Content-Type: text/plain; charset=utf-8');
  echo $reason;
  exit;
};

// Reject IP-literal hosts outright: bracketed IPv6 such as [::1] and the
// numeric / hex spellings curl would otherwise resolve (2130706433,
// 0x7f000001, 0177.0.0.1, 0x7f.0.0.1). A hostname is the only accepted form.
if (preg_match('/^\[.*\]$/', $lowerHost)
  || preg_match('/^[0-9.]+$/', $lowerHost)
  || preg_match('/(^|\.)0x[0-9a-f]+(\.|$)/i', $lowerHost)) {
  $forbid();
}

// Block obvious local host names.
if ($lowerHost === 'localhost' || substr($lowerHost, -6) === '.local' || substr($lowerHost, -10) === '.localhost') {
  $forbid();
}

// Resolve both address families and require every answer to be public.
// gethostbyname() alone misses AAAA-only hosts and IPv6 loopback.
$addresses = array();
$ipv4 = gethostbyname($host);
if ($ipv4 !== $host && filter_var($ipv4, FILTER_VALIDATE_IP)) {
  $addresses[] = $ipv4;
}
if (function_exists('dns_get_record')) {
  $aaaa = @dns_get_record($host, DNS_AAAA);
  if (is_array($aaaa)) {
    foreach ($aaaa as $record) {
      if (!empty($record['ipv6'])) $addresses[] = $record['ipv6'];
    }
  }
}
if (!$addresses) {
  $forbid('Host did not resolve');
}
foreach ($addresses as $address) {
  $bin = @inet_pton($address);
  if ($bin === false) $forbid();
  if (strlen($bin) === 16) {
    // IPv4-mapped IPv6 (::ffff:127.0.0.1) and the IPv6 special ranges.
    if (substr($bin, 0, 12) === str_repeat("\0", 10) . "\xff\xff") {
      $mapped = inet_ntop(substr($bin, 12));
      if ($mapped === false || !filter_var($mapped, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) $forbid();
      continue;
    }
    if ($bin === inet_pton('::1') || $bin === inet_pton('::')) $forbid();
    $first = ord($bin[0]);
    $second = ord($bin[1]);
    if ($first === 0xfe && ($second & 0xc0) === 0x80) $forbid(); // fe80::/10 link-local
    if (($first & 0xfe) === 0xfc) $forbid();                     // fc00::/7 unique-local
  }
  if (!filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
    $forbid();
  }
}

// Optional egress allowlist. Set NV_FETCH_ALLOWLIST="example.com,api.foo.com"
// in the hosting panel to restrict this proxy to known hosts; empty means
// "any public host" (still SSRF-checked above).
$allowlist = trim((string) getenv('NV_FETCH_ALLOWLIST'));
if ($allowlist !== '') {
  $allowedHost = false;
  foreach (explode(',', $allowlist) as $entry) {
    $entry = strtolower(trim($entry));
    if ($entry === '') continue;
    if ($lowerHost === $entry || substr($lowerHost, -strlen('.' . $entry)) === '.' . $entry) {
      $allowedHost = true;
      break;
    }
  }
  if (!$allowedHost) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Forbidden host';
    exit;
  }
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_USERAGENT, 'NuVerter/1.0');
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_MAXREDIRS, 0);

// Cap download size.
$buffer = '';
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $chunk) use (&$buffer) {
  $buffer .= $chunk;
  if (strlen($buffer) > 20000) {
    return 0; // abort
  }
  return strlen($chunk);
});

$data = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_errno($ch);
curl_close($ch);

if ($data === false || $err !== 0 || $code < 200 || $code >= 300) {
  http_response_code(502);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Fetch failed';
  exit;
}

if (strlen($buffer) > 20000) $buffer = substr($buffer, 0, 20000);
header('Content-Type: text/plain; charset=utf-8');
echo $buffer;
exit;
?>