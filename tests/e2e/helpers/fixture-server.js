import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../fixtures');

const FILES = {
  '/': { type: 'text/html; charset=utf-8', file: 'target.html' },
  '/target.html': { type: 'text/html; charset=utf-8', file: 'target.html' },
  '/marker.js': { type: 'text/javascript; charset=utf-8', file: 'marker.js' },
  '/marker.css': { type: 'text/css; charset=utf-8', file: 'marker.css' },
  '/marker.html': { type: 'text/html; charset=utf-8', file: 'marker.html' },
};

/**
 * Serve fixture assets over http://127.0.0.1.
 * Playwright Chromium's default page CSP allows http://127.0.0.1:* script/style
 * sources but blocks unsafe-inline scripts — so remote file injection is how we
 * verify executable JS under test.
 */
export async function startFixtureServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const entry = FILES[url.pathname];
    if (!entry) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': entry.type });
    res.end(fs.readFileSync(path.join(fixturesDir, entry.file)));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  return {
    port,
    origin: `http://127.0.0.1:${port}`,
    targetUrl: `http://127.0.0.1:${port}/target.html`,
    async close() {
      await new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    },
  };
}
