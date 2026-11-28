<?php
// Shared per-IP rate limiting for the PHP proxies.
//
// InfinityFree has no Redis/memcached, so the bucket lives in a small JSON
// file under the system temp directory, guarded by flock(). If that storage
// is unavailable the request is allowed: a broken limiter must not take the
// whole endpoint down.
header('Cache-Control: no-store');

function nv_client_ip() {
  // REMOTE_ADDR only. Forwarded headers are attacker-controlled on shared
  // hosting, so they are deliberately ignored.
  return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
}

function nv_rate_limit($bucket, $limit, $windowSec) {
  $dir = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'nv-rate';
  if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) return true;

  $file = $dir . DIRECTORY_SEPARATOR . preg_replace('/[^a-z0-9_-]/i', '', $bucket)
    . '-' . sha1(nv_client_ip()) . '.json';

  $fp = @fopen($file, 'c+');
  if (!$fp) return true;

  if (!flock($fp, LOCK_EX)) {
    fclose($fp);
    return true;
  }

  $raw = stream_get_contents($fp);
  $now = time();
  $data = json_decode($raw, true);
  if (!is_array($data) || !isset($data['start']) || ($data['start'] + $windowSec) <= $now) {
    $data = ['start' => $now, 'count' => 0];
  }
  $data['count'] = intval($data['count']) + 1;
  $allowed = $data['count'] <= $limit;

  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode($data));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);

  return $allowed;
}

function nv_reject_rate_limited($retryAfter = 60) {
  http_response_code(429);
  header('Retry-After: ' . intval($retryAfter));
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Too many requests';
  exit;
}
