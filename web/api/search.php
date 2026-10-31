<?php
// PHP proxy for /api/search (Wikipedia).
header('Cache-Control: no-store');

$q = isset($_GET['q']) ? trim(substr($_GET['q'], 0, 200)) : '';
if ($q === '') {
  http_response_code(400);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'missing q']);
  exit;
}

$target = 'https://en.wikipedia.org/w/api.php';
$target .= '?action=query&list=search&srsearch=' . rawurlencode($q) . '&srlimit=5&format=json&origin=*';

$ch = curl_init($target);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_USERAGENT, 'NuVerter/1.0');
$data = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($data === false || $code < 200 || $code >= 300) {
  http_response_code(502);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Bad upstream';
  exit;
}

$j = json_decode($data, true);
$results = [];
if (isset($j['query']['search']) && is_array($j['query']['search'])) {
  foreach ($j['query']['search'] as $r) {
    $title = isset($r['title']) ? $r['title'] : '';
    $snippet = isset($r['snippet']) ? strip_tags($r['snippet']) : '';
    $results[] = $title . ': ' . $snippet;
  }
}
$out = [
  'abstract' => isset($results[0]) ? $results[0] : '',
  'abstractSource' => 'Wikipedia',
  'related' => array_slice($results, 1),
];

header('Content-Type: application/json; charset=utf-8');
echo json_encode($out);
exit;
?>