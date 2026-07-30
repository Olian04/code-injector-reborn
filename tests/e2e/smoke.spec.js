import { test, expect, requiresExtensionPages } from './fixtures.js';

test.describe('extension smoke', () => {
  test('installs with a live background context', async ({ target, extension }) => {
    if (target === 'firefox') {
      expect(extension.origin).toMatch(/^moz-extension:\/\/[0-9a-f-]{36}$/);
      return;
    }

    expect(new URL(extension.origin).host).toMatch(/^[a-p]{32}$/);
    expect(extension.serviceWorker.url()).toContain(`${extension.origin}/`);
    expect(extension.serviceWorker.url()).toContain('background/service_worker.js');
  });

  test.describe('extension pages', () => {
    requiresExtensionPages(test);

    test('opens the popup and shows the rules UI', async ({ page, openPopup }) => {
      await openPopup(page);

      await expect(page.locator('#rules')).toBeVisible();
      await expect(page.locator('[data-name="btn-rules-add"]')).toBeVisible();
      await expect(page.locator('[data-name="btn-rules-add"]')).toHaveText('Add rule');
    });

    test('opens the options page', async ({ page, extension }) => {
      await page.goto(`${extension.origin}/options/index.html`);
      await expect(page.locator('#options-list')).toBeVisible();
      await expect(page.locator('[data-name="btn-show-modal-import"]')).toBeVisible();
      await expect(page.locator('[data-name="btn-show-modal-export"]')).toBeVisible();
      await expect(page.locator('[data-name="cb-show-counter"]')).toBeVisible();
    });
  });
});
