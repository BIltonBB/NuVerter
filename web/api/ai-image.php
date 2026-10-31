<?php
// PHP proxy for /api/ai-image (InfinityFree has no Node.js).
// Mirrors web/server.cjs proxyAiImage().
header('Cache-Control: no-store');

$MODEL_MAP = [
  'flux' => 'flux',
  'gptimage' => 'gptimage',
  'turbo' => 'turbo',
  'sana' => 'sana',
  'sdxl' => 'stability-ai/sdxl-turbo',
  'flux2' => 'black-forest-labs/flux.2-klein-4b',
];

function clampInt($v, $min, $max, $fallback) {
  if (!is_numeric($v)) return $fallback;
  $n = intval($v);
  if ($n < $min) return $min;
  if ($n > $max) return $max;
  return $n;
}

$prompt = isset($_GET['prompt']) ? trim(substr($_GET['prompt'], 0, 1200)) : '';
$negative = isset($_GET['negative']) ? trim(substr($_GET['negative'], 0, 1200)) : '';
if ($prompt === '') {
  http_response_code(400);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Missing prompt';
  exit;
}

$modelParam = isset($_GET['model']) ? $_GET['model'] : 'flux';
$alias = array_key_exists($modelParam, $MODEL_MAP) ? $modelParam : 'flux';
$model = $MODEL_MAP[$alias];

$width = clampInt(isset($_GET['width']) ? $_GET['width'] : 512, 256, 1280, 512);
$height = clampInt(isset($_GET['height']) ? $_GET['height'] : 512, 256, 1280, 512);
$seed = clampInt(isset($_GET['seed']) ? $_GET['seed'] : 0, 0, 2147483647, mt_rand(0, 2147483647));

$target = 'https://image.pollinations.ai/prompt/' . rawurlencode($prompt);
$target .= '?model=' . rawurlencode($model);
$target .= '&width=' . $width;
$target .= '&height=' . $height;
$target .= '&seed=' . $seed;
if ($negative !== '') $target .= '&negative=' . rawurlencode($negative);
$target .= '&nologo=true';

$key = '';
if (isset($_SERVER['HTTP_X_POLLINATIONS_KEY'])) $key = trim($_SERVER['HTTP_X_POLLINATIONS_KEY']);
if ($key === '' && getenv('POLLINATIONS_API_KEY')) $key = trim(getenv('POLLINATIONS_API_KEY'));
if ($key !== '') $target .= '&key=' . rawurlencode($key);

$ch = curl_init($target);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 150);
curl_setopt($ch, CURLOPT_USERAGENT, 'NuVerter/1.0');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: image/*']);
$data = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$ctype = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$err = curl_error($ch);
curl_close($ch);

if ($data === false || $code < 200 || $code >= 300) {
  http_response_code($code ? $code : 502);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Upstream returned ' . ($code ? $code : 502) . ($err ? ' ' . $err : '');
  exit;
}

header('Content-Type: ' . ($ctype ? $ctype : 'image/jpeg'));
header('Cross-Origin-Resource-Policy: same-origin');
echo $data;
exit;
?>