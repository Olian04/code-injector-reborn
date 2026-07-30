import { test, expect } from './fixtures.js';
import { startFixtureServer } from './helpers/fixture-server.js';
import { makeRule } from './helpers/rules.js';
import {
  expectInlineCssInjected,
  expectInlineHtmlInjected,
  expectInlineJsScriptPresent,
  expectNoInjection,
} from './helpers/assertions.js';

test.describe('inline injection', () => {
  /** @type {Awaited<ReturnType<typeof startFixtureServer>>} */
  let server;

  test.beforeAll(async () => {
    server = await startFixtureServer();
  });

  test.afterAll(async () => {
    await server.close();
  });

  test('injects inline CSS', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        css: 'html { background-color: rgb(1, 2, 3) !important; }',
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');
    await expectInlineCssInjected(page, expect);
  });

  test('injects inline HTML into the page body', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        html: '<div id="ci-inline-html">inline-html</div>',
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');
    await expectInlineHtmlInjected(page, expect);
    await expect(page.locator('#ci-inline-html')).toHaveText('inline-html');
  });

  test('inserts an inline JS script node (execution blocked by page CSP in Playwright)', async ({
    page,
    seedRules,
  }) => {
    const snippet = 'data-ci-inline-js';
    await seedRules([
      makeRule({
        js: `document.documentElement.setAttribute("${snippet}", "1");`,
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');

    // Playwright Chromium forbids unsafe-inline scripts, so the attribute will
    // not be set — but the extension should still append the script element.
    await expectInlineJsScriptPresent(page, expect, snippet);
    await expect(page.locator('html')).not.toHaveAttribute(snippet, '1');
  });

  test('injects inline CSS + HTML together from one rule', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        css: 'html { background-color: rgb(10, 20, 30) !important; }',
        html: '<div id="ci-inline-html">combo</div>',
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');

    await expectInlineHtmlInjected(page, expect);
    await expectInlineCssInjected(page, expect, 'rgb(10, 20, 30)');
  });

  test('skips comment-only inline CSS (containsCode filter)', async ({ page, seedRules }) => {
    await seedRules([
      makeRule({
        css: '/* just a comment */',
        html: '',
        js: '',
      }),
    ]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    await expectNoInjection(page, expect);
    const styleCount = await page.evaluate(() => document.querySelectorAll('style').length);
    expect(styleCount).toBe(0);
  });
});
