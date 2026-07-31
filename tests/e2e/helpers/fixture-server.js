import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../fixtures');

const FILES = {
  '/': { type: 'text/html; charset=utf-8', file: 'target.html' },
  '/target.html': { type: 'text/html; charset=utf-8', file: 'target.html' },
  '/marker.js': { type: 'text/javascript; charset=utf-8', file: 'marker.js' },
};

/**
 * Serve fixture assets over http://127.0.0.1.
 * Chromium's default MV3 policy whitelists http://127.0.0.1:*, so a module
 * served from here is one an injected `import()` is allowed to fetch.
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
