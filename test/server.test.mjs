// Zero-dependency integration tests for the local server.
// Run with: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, '..', 'web', 'server.cjs');
const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;

let child;

before(async () => {
  child = spawn(process.execPath, [SERVER, String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stderr.on('data', () => {});
  // Wait for the listener instead of guessing a delay.
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(BASE + '/index.html', { method: 'HEAD' });
      if (res.status) return;
    } catch {}
    await delay(100);
  }
  throw new Error('server did not start');
});

after(() => {
  if (child && !child.killed) child.kill();
});

test('serves the app shell', async () => {
  const res = await fetch(BASE + '/index.html');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /text\/html/);
  const body = await res.text();
  assert.match(body, /<html/i);
});

test('blocks path traversal outside the web root', async () => {
  const res = await fetch(BASE + '/../package.json');
  assert.ok(res.status === 403 || res.status === 404, `got ${res.status}`);
  const body = await res.text();
  assert.doesNotMatch(body, /nuverter-web/);
});

test('rejects loopback targets on /api/fetch', async () => {
  const target = encodeURIComponent(`${BASE}/index.html`);
  const res = await fetch(`${BASE}/api/fetch?url=${target}`);
  assert.equal(res.status, 403);
});

test('rejects malformed /api/fetch urls', async () => {
  const res = await fetch(`${BASE}/api/fetch?url=file:///etc/passwd`);
  assert.equal(res.status, 400);
});

test('requires a local Host header for the image proxy', async () => {
  // node:fetch treats Host as forbidden, so use a raw request.
  const http = await import('node:http');
  const status = await new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: PORT, path: '/api/ai-image?prompt=test', headers: { Host: 'evil.example.com' } },
      (res) => { res.resume(); resolve(res.statusCode); }
    );
    req.on('error', reject);
    req.end();
  });
  assert.equal(status, 403);
});

test('returns 404 for unknown assets', async () => {
  const res = await fetch(BASE + '/definitely-not-here.js');
  assert.equal(res.status, 404);
});
