import { test, expect, requiresExtensionPages } from './fixtures.js';

const LIGHT_SURFACE = 'rgb(238, 238, 238)';
const DARK_SURFACE = 'rgb(27, 29, 32)';

const surfaceColor = (page) =>
  page.locator('#rules').evaluate((el) => getComputedStyle(el).backgroundColor);

test.describe('appearance', () => {
  requiresExtensionPages(test);

  test('follows the operating system colour scheme', async ({ page, openPopup }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openPopup(page);
    await expect.poll(() => surfaceColor(page)).toBe(DARK_SURFACE);

    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => surfaceColor(page)).toBe(LIGHT_SURFACE);
  });

  test('an override from the options page wins over the system setting', async ({
    page,
    extension,
    openPopup,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto(`${extension.origin}/options/index.html`);
    await page.locator('[data-name="sel-theme"]').selectOption('light');

    await openPopup(page);
    // Set by the boot script from the cached preference, before React runs.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect.poll(() => surfaceColor(page)).toBe(LIGHT_SURFACE);
  });

  test('the override is stored in settings and survives a reload', async ({
    page,
    extension,
  }) => {
    await page.goto(`${extension.origin}/options/index.html`);
    await page.locator('[data-name="sel-theme"]').selectOption('dark');

    await page.reload();
    await expect(page.locator('[data-name="sel-theme"]')).toHaveValue('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
