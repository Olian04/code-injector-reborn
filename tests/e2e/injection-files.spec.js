import { test, expect } from './fixtures.js';
import { startFixtureServer } from './helpers/fixture-server.js';
import { makeRule, remoteFile, localFile } from './helpers/rules.js';
import {
  expectRemoteJsInjected,
  expectRemoteCssInjected,
  expectNoInjection,
  expectInlineJsScriptPresent,
} from './helpers/assertions.js';

test.describe('file injection', () => {
  /** @type {Awaited<ReturnType<typeof startFixtureServer>>} */
  let server;

  test.beforeAll(async () => {
    server = await startFixtureServer();
  });

  test.afterAll(async () => {
    await server.close();
  });

  test('injects a remote JavaScript file', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        files: [remoteFile(server.origin, 'marker.js', 'js')],
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');
    await expectRemoteJsInjected(page, expect);
  });

  test('injects a remote CSS file', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        files: [remoteFile(server.origin, 'marker.css', 'css')],
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');
    await expectRemoteCssInjected(page, expect);
  });

  test('does not inject remote HTML files (unsupported)', async ({ page, seedRules }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await seedRules([
      makeRule({
        files: [remoteFile(server.origin, 'marker.html', 'html')],
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);

    await expect(page.locator('#ci-remote-html')).toHaveCount(0);
    expect(errors.some((t) => /Cannot request remote HTML files/i.test(t))).toBe(true);
  });

  test('local file rules emit an MV3 unsupported error script', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        files: [localFile('/tmp/does-not-matter.js', 'js')],
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');

    // Local files are rejected in the service worker and replaced with an
    // inline console.error script. Under Playwright CSP that script will not
    // run, but it should still be present in the DOM.
    await expectInlineJsScriptPresent(
      page,
      expect,
      'local file injection is no longer supported in Manifest V3'
    );
  });

  test('injects remote JS and CSS files from one rule (files before inline)', async ({
    page,
    seedRules,
  }) => {
    await seedRules([
      makeRule({
        css: 'html { background-color: rgb(1, 2, 3) !important; }',
        files: [
          remoteFile(server.origin, 'marker.js', 'js'),
          remoteFile(server.origin, 'marker.css', 'css'),
        ],
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');

    await expectRemoteJsInjected(page, expect);
    // Remote CSS sets color; inline CSS sets background.
    await expectRemoteCssInjected(page, expect);
    await expect
      .poll(async () => {
        return page.locator('html').evaluate((el) => getComputedStyle(el).backgroundColor);
      })
      .toBe('rgb(1, 2, 3)');
  });

  test('skips files with unrecognized extensions', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        files: [
          {
            path: `${server.origin}/marker.js`,
            type: 'remote',
            ext: '', // serializeRules skips falsy ext
          },
        ],
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
    await expectNoInjection(page, expect);
  });
});
