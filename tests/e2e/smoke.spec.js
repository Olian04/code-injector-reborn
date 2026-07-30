import { test, expect } from './fixtures.js';

test.describe('extension smoke', () => {
  test('loads a Manifest V3 service worker', async ({ serviceWorker, extensionId }) => {
    expect(extensionId).toMatch(/^[a-p]{32}$/);
    expect(serviceWorker.url()).toContain(`chrome-extension://${extensionId}/`);
    expect(serviceWorker.url()).toContain('background/service_worker.js');
  });

  test('opens the popup and shows the rules UI', async ({ page, openPopup }) => {
    await openPopup(page);

    await expect(page.locator('#rules')).toBeVisible();
    await expect(page.locator('[data-name="btn-rules-add"]')).toBeVisible();
    await expect(page.locator('[data-name="btn-rules-add"]')).toHaveText('Add rule');
  });

  test('opens the options page', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/options/index.html`);
    await expect(page.locator('#options-list')).toBeVisible();
    await expect(page.locator('[data-name="btn-show-modal-import"]')).toBeVisible();
    await expect(page.locator('[data-name="btn-show-modal-export"]')).toBeVisible();
    await expect(page.locator('[data-name="cb-show-counter"]')).toBeVisible();
  });
});
