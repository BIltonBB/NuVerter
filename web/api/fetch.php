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
// Block obvious local/private hosts.
$lowerHost = strtolower($host);
if ($lowerHost === 'localhost' || $lowerHost === '127.0.0.1' || $lowerHost === '::1' || substr($lowerHost, -6) === '.local') {
  http_response_code(403);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Forbidden host';
  exit;
}

// Resolve and block private/link-local IP ranges.
$ip = gethostbyname($host);
if ($ip !== $host && filter_var($ip, FILTER_VALIDATE_IP)) {
  if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Forbidden host';
    exit;
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