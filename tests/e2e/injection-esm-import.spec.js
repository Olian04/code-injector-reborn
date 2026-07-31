import { test, expect } from './fixtures.js';
import { startFixtureServer } from './helpers/fixture-server.js';
import { makeRule } from './helpers/rules.js';
import {
  expectInlineJsScriptPresent,
  expectMarkerModuleRan,
} from './helpers/assertions.js';

/**
 * Loading a module from a URL out of the JavaScript tab is the workflow that
 * replaced the removed per-rule file list, so it gets its own coverage.
 */
test.describe('ESM import from the JavaScript tab', () => {
  /** @type {Awaited<ReturnType<typeof startFixtureServer>>} */
  let server;

  test.beforeAll(async () => {
    server = await startFixtureServer();
  });

  test.afterAll(async () => {
    await server.close();
  });

  test('imports and runs a module served over http', async ({
    page,
    seedRules,
    target,
  }) => {
    const moduleUrl = `${server.origin}/marker.js`;
    await seedRules([makeRule({ js: `import(${JSON.stringify(moduleUrl)});` })]);

    await page.goto(server.targetUrl);
    await page.waitForLoadState('load');

    await expectInlineJsScriptPresent(page, expect, moduleUrl);

    if (target === 'firefox') {
      await expectMarkerModuleRan(page, expect);
    } else {
      // Chromium refuses to run any script node a content script appends,
      // whatever the page allows, because it checks the extension's own MV3
      // policy instead. The import therefore never gets to start. See the
      // "Injection flow" notes in README.md.
      await expect(page.locator('html')).not.toHaveAttribute(
        'data-ci-injected',
        '1'
      );
    }
  });
});
