import { test as base, chromium, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pathToExtension = path.join(root, 'dist', 'chrome');

/**
 * @typedef {object} ExtensionFixtures
 * @property {import('@playwright/test').BrowserContext} context
 * @property {string} extensionId
 * @property {import('@playwright/test').Worker} serviceWorker
 * @property {(page: import('@playwright/test').Page) => Promise<void>} openPopup
 * @property {(rules: object[]) => Promise<void>} seedRules
 */

/** @type {import('@playwright/test').TestType<ExtensionFixtures, {}>} */
export const test = base.extend({
  // Override the default context: extensions require a persistent profile.
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      // Headless Chromium supports extensions when using Playwright's channel.
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },

  // Playwright launches a default page we do not use; keep the fixture happy.
  page: async ({ context }, use) => {
    const page = context.pages()[0] || (await context.newPage());
    await use(page);
  },

  serviceWorker: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) {
      worker = await context.waitForEvent('serviceworker', { timeout: 30_000 });
    }
    await use(worker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    const extensionId = new URL(serviceWorker.url()).host;
    await use(extensionId);
  },

  openPopup: async ({ extensionId }, use) => {
    await use(async (page) => {
      // Extension.js emits the action popup under action/
      await page.goto(`chrome-extension://${extensionId}/action/index.html`);
      await page.waitForFunction(() => !document.body.dataset.loading, null, {
        timeout: 30_000,
      });
    });
  },

  seedRules: async ({ serviceWorker }, use) => {
    await use(async (rules) => {
      await serviceWorker.evaluate(async (nextRules) => {
        await chrome.storage.local.set({ rules: nextRules });
      }, rules);
      // Give the background listener a tick to re-serialize into parsedRules.
      await serviceWorker.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    });
  },
});

export { expect };
