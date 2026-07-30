import { test, expect } from './fixtures.js';
import { startFixtureServer } from './helpers/fixture-server.js';
import { makeRule, remoteFile } from './helpers/rules.js';
import {
  expectInlineCssInjected,
  expectInlineHtmlInjected,
  expectRemoteJsInjected,
  expectNoInjection,
} from './helpers/assertions.js';

test.describe('injection timing and guards', () => {
  /** @type {Awaited<ReturnType<typeof startFixtureServer>>} */
  let server;

  test.beforeAll(async () => {
    server = await startFixtureServer();
  });

  test.afterAll(async () => {
    await server.close();
  });

  test('onLoad rule injects after the page load event', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        onLoad: true,
        css: 'html { background-color: rgb(1, 2, 3) !important; }',
        html: '<div id="ci-inline-html">on-load</div>',
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');

    await expectInlineCssInjected(page, expect);
    await expectInlineHtmlInjected(page, expect);
  });

  test('onCommit rule injects CSS without waiting for load', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        onLoad: false,
        // HTML needs document.body; CSS only needs head, which exists earlier.
        css: 'html { background-color: rgb(7, 8, 9) !important; }',
      }),
    ]);

    await page.goto(server.targetUrl);
    // Do not wait for full load — onCommit should already have applied CSS.
    await expectInlineCssInjected(page, expect, 'rgb(7, 8, 9)');
  });

  test('disabled rules are not injected', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        enabled: false,
        css: 'html { background-color: rgb(1, 2, 3) !important; }',
        html: '<div id="ci-inline-html">disabled</div>',
        files: [remoteFile(server.origin, 'marker.js', 'js')],
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
    await expectNoInjection(page, expect);
  });

  test('does not inject when the URL pattern does not match', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        selector: 'no-such-host\\.example',
        css: 'html { background-color: rgb(1, 2, 3) !important; }',
        html: '<div id="ci-inline-html">no-match</div>',
        files: [remoteFile(server.origin, 'marker.js', 'js')],
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);
    await expectNoInjection(page, expect);
  });

  test('only matching rules in a mixed list are injected', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        selector: 'no-such-host\\.example',
        html: '<div id="ci-should-not-exist">nope</div>',
      }),
      makeRule({
        selector: '127\\.0\\.0\\.1',
        files: [remoteFile(server.origin, 'marker.js', 'js')],
        html: '<div id="ci-inline-html">matched</div>',
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');

    await expectRemoteJsInjected(page, expect);
    await expectInlineHtmlInjected(page, expect);
    await expect(page.locator('#ci-should-not-exist')).toHaveCount(0);
  });
});
