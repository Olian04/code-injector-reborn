import { test, expect, requiresExtensionPages } from './fixtures.js';
import { makeRule } from './helpers/rules.js';

test.describe('popup rules list', () => {
  requiresExtensionPages(test);

  test('lists a seeded rule in the popup', async ({ page, openPopup, seedRules }) => {
    await seedRules([
      makeRule({
        selector: 'popup-list-check',
        css: 'body{}',
      }),
    ]);

    await openPopup(page);

    const rule = page.locator('.rules-list .rule').first();
    await expect(rule).toBeVisible();
    await expect(rule.locator('.r-name')).toContainText('popup-list-check');
  });

  test('shows insight dots for JS, CSS and HTML', async ({
    page,
    openPopup,
    seedRules,
  }) => {
    await seedRules([
      makeRule({
        selector: 'insight-dots',
        js: 'console.log(1)',
        css: 'body { color: red; }',
        html: '<div></div>',
      }),
    ]);

    await openPopup(page);

    const rule = page.locator('.rules-list .rule').first();
    await expect(rule.locator('.color-js[data-active="true"]')).toBeVisible();
    await expect(rule.locator('.color-css[data-active="true"]')).toBeVisible();
    await expect(rule.locator('.color-html[data-active="true"]')).toBeVisible();
  });

  test('disabled rules still appear in the list', async ({ page, openPopup, seedRules }) => {
    await seedRules([
      makeRule({
        selector: 'disabled-rule',
        enabled: false,
        css: 'body{}',
      }),
    ]);

    await openPopup(page);

    const rule = page.locator('.rules-list .rule').first();
    await expect(rule).toBeVisible();
    await expect(rule).toHaveAttribute('data-enabled', 'false');
  });
});
