// Zero-dependency local server for the Universal Converter studio.
// Usage: node server.js [port]
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function clampInt(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

const AI_PROXY_MODEL_MAP = {
  flux: 'flux',
  gptimage: 'gptimage',
  turbo: 'turbo',
  sana: 'sana',
  sdxl: 'stability-ai/sdxl-turbo',
  flux2: 'black-forest-labs/flux.2-klein-4b'
};

// Simple per-IP token bucket for /api/ai-image (prevents quota burn).
const AI_RATE = new Map();
function aiRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 20;
  let entry = AI_RATE.get(ip);
  if (!entry || now - entry.start > windowMs) {
    entry = { start: now, count: 0 };
    AI_RATE.set(ip, entry);
  }
  entry.count += 1;
  return entry.count <= max;
}

function proxyAiImage(req, res) {
  return new Promise((resolve, reject) => {
    const incoming = new URL(req.url, 'http://localhost');
    const prompt = String(incoming.searchParams.get('prompt') || '').slice(0, 1200).trim();
    const negative = String(incoming.searchParams.get('negative') || '').slice(0, 1200).trim();
    if (!prompt) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Missing prompt');
      resolve();
      return;
    }

    const modelParam = incoming.searchParams.get('model') || 'flux';
    const alias = Object.prototype.hasOwnProperty.call(AI_PROXY_MODEL_MAP, modelParam) ? modelParam : 'flux';
    const model = AI_PROXY_MODEL_MAP[alias];
    const width = clampInt(incoming.searchParams.get('width'), 256, 1280, 512);
    const height = clampInt(incoming.searchParams.get('height'), 256, 1280, 512);
    const seed = clampInt(incoming.searchParams.get('seed'), 0, 2147483647, Math.floor(Math.random() * 2147483647));

    const target = new URL('https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt));
    target.searchParams.set('model', model);
    target.searchParams.set('width', String(width));
    target.searchParams.set('height', String(height));
    target.searchParams.set('seed', String(seed));
    if (negative) target.searchParams.set('negative', negative);
    target.searchParams.set('nologo', 'true');

    const pollinationsKey = String(req.headers['x-pollinations-key'] || process.env.POLLINATIONS_API_KEY || '').trim();
    if (pollinationsKey) target.searchParams.set('key', pollinationsKey);
    const request = https.get(target, {
      headers: { 'User-Agent': 'NuVerter/1.0', Accept: 'image/*' }
    }, (upstream) => {
      if (!upstream.statusCode || upstream.statusCode < 200 || upstream.statusCode >= 300) {
        res.writeHead(upstream.statusCode || 502, { 'Content-Type': 'text/plain; charset=utf-8' });
        upstream.resume();
        res.end('Upstream returned ' + (upstream.statusCode || 502));
        resolve();
        return;
      }
      res.writeHead(200, {
        'Content-Type': upstream.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'no-store',
        'Cross-Origin-Resource-Policy': 'same-origin'
      });
      upstream.pipe(res);
      upstream.on('end', resolve);
      upstream.on('error', reject);
    });

    request.on('error', reject);
    request.setTimeout(150000, () => request.destroy(new Error('Image request timed out')));
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (pathname === '/') pathname = '/index.html';

  // Optional online AI image proxy. Pollinations rejects requests whose Origin
  // is localhost, and this also avoids any CORS friction. The local server does
  // not store the prompt or the image.
  if (pathname === '/api/search') {
    const host = String(req.headers.host || '').toLowerCase();
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Forbidden host');
      return;
    }
    const ip = req.socket?.remoteAddress || 'unknown';
    if (!aiRateLimit(ip)) {
      res.writeHead(429, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' }).end('Too many requests');
      return;
    }
    const q = String(new URL(req.url, 'http://localhost').searchParams.get('q') || '').slice(0, 200).trim();
    if (!q) { res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'missing q' })); return; }
    const target = new URL('https://en.wikipedia.org/w/api.php');
    target.searchParams.set('action', 'query');
    target.searchParams.set('list', 'search');
    target.searchParams.set('srsearch', q);
    target.searchParams.set('srlimit', '5');
    target.searchParams.set('format', 'json');
    target.searchParams.set('origin', '*');
    https.get(target, { headers: { 'User-Agent': 'NuVerter/1.0' } }, (upstream) => {
      let data = '';
      upstream.setEncoding('utf8');
      upstream.on('data', (c) => { data += c; });
      upstream.on('end', () => {
        try {
          const j = JSON.parse(data);
          const results = (j?.query?.search || []).map((r) => (r.title + ': ' + String(r.snippet || '').replace(/<[^>]+>/g, '')));
          const out = { abstract: results[0] || '', abstractSource: 'Wikipedia', related: results.slice(1) };
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify(out));
        } catch {
          res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad upstream');
        }
      });
    }).on('error', (e) => {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Search failed: ' + (e?.message || 'unknown'));
    });
    return;
  }

  if (pathname === '/api/fetch') {
    const host = String(req.headers.host || '').toLowerCase();
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) { res.writeHead(403).end('Forbidden host'); return; }
    const ip = req.socket?.remoteAddress || 'unknown';
    if (!aiRateLimit(ip)) { res.writeHead(429).end('Too many requests'); return; }
    const url = String(new URL(req.url, 'http://localhost').searchParams.get('url') || '').trim();
    if (!/^https?:\/\//i.test(url)) { res.writeHead(400).end('Invalid url'); return; }
    https.get(url, { headers: { 'User-Agent': 'NuVerter/1.0' } }, (upstream) => {
      let data = '';
      upstream.setEncoding('utf8');
      upstream.on('data', (c) => { if (data.length < 20000) data += c; });
      upstream.on('end', () => { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(data.slice(0, 20000)); });
    }).on('error', (e) => { if (!res.headersSent) res.writeHead(502); res.end('Fetch failed: ' + (e?.message || 'unknown')); });
    return;
  }

  if (pathname === '/api/ai-image') {
    const host = String(req.headers.host || '').toLowerCase();
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Forbidden host');
      return;
    }
    const ip = req.socket?.remoteAddress || 'unknown';
    if (!aiRateLimit(ip)) {
      res.writeHead(429, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' }).end('Too many requests');
      return;
    }
    proxyAiImage(req, res).catch((error) => {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Image proxy failed: ' + (error?.message || 'unknown error'));
    });
    return;
  }

  const target = path.normalize(path.join(ROOT, pathname));
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    const headers = {
      'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      // Required if the multi-threaded ffmpeg core is ever swapped in.
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-origin'
    };
    res.writeHead(200, headers);
    fs.createReadStream(target).pipe(res);
  });
});

function tryListen(port) {
  const s = server.listen(port, '127.0.0.1', () => {
    console.log('');
    console.log('  NuVerter is running');
    console.log('  ->  http://localhost:' + port);
    console.log('');
    console.log('  Press Ctrl+C to stop.');
  });
  s.on('error', (e) => {
    if (e.code === 'EADDRINUSE') { tryListen(port + 1); } else { console.error(e); process.exit(1); }
  });
}
tryListen(PORT);
