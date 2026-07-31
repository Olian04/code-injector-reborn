import { test, expect, requiresExtensionPages } from './fixtures.js';

test.describe('options', () => {
  requiresExtensionPages(test);

  test('opens options inside the action popup', async ({ page, openPopup }) => {
    await openPopup(page);

    await page.locator('[data-name="btn-general-options-show"]').click();
    await expect(page.locator('#body')).toHaveAttribute('data-options', 'true');
    await expect(page.locator('#options #options-list')).toBeVisible();
    await expect(page.locator('[data-name="sel-theme"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#body')).not.toHaveAttribute('data-options');
  });

  test('an appearance change in the popup options persists on the standalone page', async ({
    page,
    extension,
    openPopup,
  }) => {
    await openPopup(page);
    await page.locator('[data-name="btn-general-options-show"]').click();
    await expect(page.locator('#options [data-name="sel-theme"]')).toBeVisible();

    await page.locator('#options [data-name="sel-theme"]').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.goto(`${extension.origin}/options/index.html`);
    await expect(page.locator('[data-name="sel-theme"]')).toHaveValue('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('the standalone options page still works alone', async ({
    page,
    extension,
  }) => {
    await page.goto(`${extension.origin}/options/index.html`);
    await expect(page.locator('html')).toHaveClass(/options-page/);
    await expect(page.locator('#options-list')).toBeVisible();
    await expect(page.locator('[data-name="btn-show-modal-import"]')).toBeVisible();
    await expect(page.locator('[data-name="btn-show-modal-export"]')).toBeVisible();
    await expect(page.locator('[data-name="cb-show-counter"]')).toBeVisible();

    await page.locator('[data-name="sel-theme"]').selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('[data-name="sel-theme"]')).toHaveValue('light');
  });
});
