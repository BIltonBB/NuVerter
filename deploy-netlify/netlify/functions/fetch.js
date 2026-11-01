exports.handler = async (event) => {
  const url = (event.queryStringParameters && event.queryStringParameters.url) || '';
  const target = String(url).trim();
  if (!/^https?:\/\//i.test(target)) {
    return { statusCode: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Invalid url' };
  }
  try {
    const upstream = await fetch(target, { headers: { 'User-Agent': 'NuVerter/1.0' } });
    let data = await upstream.text();
    if (!upstream.ok) return { statusCode: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Fetch failed' };
    if (data.length > 20000) data = data.slice(0, 20000);
    return { statusCode: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, body: data };
  } catch (e) {
    return { statusCode: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Fetch failed: ' + (e && e.message ? e.message : 'unknown') };
  }
};