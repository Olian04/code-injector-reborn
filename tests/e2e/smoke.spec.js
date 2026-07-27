import { test, expect } from './fixtures.js';

test.describe('extension smoke', () => {
  test('loads a Manifest V3 service worker', async ({ serviceWorker, extensionId }) => {
    expect(extensionId).toMatch(/^[a-p]{32}$/);
    expect(serviceWorker.url()).toContain(`chrome-extension://${extensionId}/`);
    expect(serviceWorker.url()).toContain('background.js');
  });

  test('opens the popup and shows the rules UI', async ({ page, openPopup }) => {
    await openPopup(page);

    await expect(page.locator('#rules')).toBeVisible();
    await expect(page.locator('[data-name="btn-rules-add"]')).toBeVisible();
    await expect(page.locator('[data-name="btn-rules-add"]')).toHaveText('Add rule');
  });
});
