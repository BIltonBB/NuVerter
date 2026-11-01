exports.handler = async (event) => {
  const q = (event.queryStringParameters && event.queryStringParameters.q) || '';
  const query = String(q).slice(0, 200).trim();
  if (!query) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ error: 'missing q' }) };
  }
  try {
    const target = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(query) + '&srlimit=5&format=json&origin=*';
    const upstream = await fetch(target, { headers: { 'User-Agent': 'NuVerter/1.0' } });
    const data = await upstream.text();
    if (!upstream.ok) return { statusCode: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Bad upstream' };
    const j = JSON.parse(data);
    const results = (j && j.query && Array.isArray(j.query.search)) ? j.query.search.map((r) => (r.title + ': ' + String(r.snippet || '').replace(/<[^>]+>/g, ''))) : [];
    const out = { abstract: results[0] || '', abstractSource: 'Wikipedia', related: results.slice(1) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Search failed: ' + (e && e.message ? e.message : 'unknown') };
  }
};