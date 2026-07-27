import { test, expect } from './fixtures.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');
const fixtureHtml = fs.readFileSync(path.join(fixturesDir, 'target.html'), 'utf8');
const markerJs = fs.readFileSync(path.join(fixturesDir, 'marker.js'), 'utf8');

/**
 * Serve fixture assets over http://127.0.0.1 so injected <script src>
 * tags are allowed by Playwright Chromium's default page CSP (which
 * permits http://127.0.0.1:* but blocks unsafe-inline scripts).
 */
async function startFixtureServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/target.html' || url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fixtureHtml);
      return;
    }
    if (url.pathname === '/marker.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
      res.end(markerJs);
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    port,
    origin: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    },
  };
}

function makeRule(origin, overrides = {}) {
  return {
    selector: '127\\.0\\.0\\.1',
    enabled: true,
    onLoad: true,
    topFrameOnly: true,
    code: {
      js: '',
      css: 'html { background-color: rgb(1, 2, 3) !important; }',
      html: '<div id="ci-html-marker">marker</div>',
      files: [
        {
          path: `${origin}/marker.js`,
          type: 'remote',
          ext: 'js',
        },
      ],
    },
    ...overrides,
  };
}

test.describe('rule injection', () => {
  /** @type {{ port: number, origin: string, close: () => Promise<void> }} */
  let server;

  test.beforeAll(async () => {
    server = await startFixtureServer();
  });

  test.afterAll(async () => {
    await server.close();
  });

  test('injects JS, CSS and HTML from a seeded rule into a matching page', async ({
    page,
    seedRules,
  }) => {
    await seedRules([makeRule(server.origin)]);

    await page.goto(`${server.origin}/target.html`);
    await page.waitForLoadState('load');

    await expect
      .poll(async () => page.locator('html').getAttribute('data-ci-injected'), {
        timeout: 15_000,
      })
      .toBe('1');

    await expect(page).toHaveTitle('CI_INJECTED');
    await expect(page.locator('#ci-html-marker')).toBeVisible();
    await expect
      .poll(async () => {
        return page.locator('html').evaluate((el) => getComputedStyle(el).backgroundColor);
      })
      .toBe('rgb(1, 2, 3)');
  });

  test('does not inject when the URL pattern does not match', async ({
    page,
    seedRules,
  }) => {
    await seedRules([
      makeRule(server.origin, {
        selector: 'no-such-host\\.example',
      }),
    ]);

    await page.goto(`${server.origin}/target.html`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);

    await expect(page.locator('html')).not.toHaveAttribute('data-ci-injected', '1');
    await expect(page.locator('#ci-html-marker')).toHaveCount(0);
    await expect(page).toHaveTitle('Code Injector Fixture');
  });

  test('lists a seeded rule in the popup', async ({ page, openPopup, seedRules }) => {
    await seedRules([
      makeRule(server.origin, {
        selector: 'popup-list-check',
      }),
    ]);

    await openPopup(page);

    const rule = page.locator('.rules-list .rule').first();
    await expect(rule).toBeVisible();
    await expect(rule.locator('.r-name')).toContainText('popup-list-check');
  });
});
