<?php
// PHP proxy for /api/fetch.
header('Cache-Control: no-store');

$url = isset($_GET['url']) ? trim($_GET['url']) : '';
if (!preg_match('#^https?://#i', $url)) {
  http_response_code(400);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Invalid url';
  exit;
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_USERAGENT, 'NuVerter/1.0');
curl_setopt($ch, CURLOPT_RANGE, ''); // no range
$data = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($data === false || $code < 200 || $code >= 300) {
  http_response_code(502);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Fetch failed';
  exit;
}

if (strlen($data) > 20000) $data = substr($data, 0, 20000);
header('Content-Type: text/plain; charset=utf-8');
echo $data;
exit;
?>