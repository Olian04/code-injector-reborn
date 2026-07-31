import { test, expect, requiresExtensionPages } from './fixtures.js';
import { makeRule } from './helpers/rules.js';

test.describe('pre-rendered popup shell', () => {
  requiresExtensionPages(test);

  test('paints the rules shell even if the bundle never loads', async ({
    page,
    extension,
  }) => {
    await page.route('**/action/index.js', (route) => route.abort());
    await page.goto(`${extension.origin}/action/index.html`);

    await expect(page.locator('#rules .rule-placeholder')).toBeVisible();
    await expect(page.locator('.rules-controls .btn-primary')).toHaveText('Add rule');
    // React never booted, so nothing cleared the loading flag.
    await expect(page.locator('body')).toHaveAttribute('data-loading', 'true');
  });

  test('paints well before React renders the stored rules', async ({
    page,
    extension,
    seedRules,
  }) => {
    await seedRules([makeRule({ css: 'body{color:red}' })]);
    await page.goto(`${extension.origin}/action/index.html`, { waitUntil: 'commit' });

    const fcp = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const read = () =>
            performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
          const seen = read();
          if (seen !== undefined) return resolve(seen);
          new PerformanceObserver((list, observer) => {
            if (list.getEntriesByName('first-contentful-paint')[0]) {
              observer.disconnect();
              resolve(read());
            }
          }).observe({ type: 'paint', buffered: true });
        })
    );

    await page.locator('.rule:not(.rule-placeholder)').first().waitFor();
    const rulesPainted = await page.evaluate(() => performance.now());

    expect(fcp).toBeGreaterThan(0);
    expect(fcp).toBeLessThan(rulesPainted - 10);
  });
});
