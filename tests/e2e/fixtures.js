import { test as base, chromium, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchFirefoxWithExtension } from './helpers/firefox-extension.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * @typedef {object} Extension
 * @property {import('@playwright/test').BrowserContext} context
 * @property {string} origin            Root URL of the installed extension
 * @property {boolean} canOpenPages     Whether the harness can navigate to extension pages
 * @property {import('@playwright/test').Worker} [serviceWorker]
 * @property {(rules: object[]) => Promise<void>} seedRules
 */

/**
 * @typedef {object} ExtensionFixtures
 * @property {'chromium' | 'firefox'} target
 * @property {Extension} extension
 * @property {import('@playwright/test').BrowserContext} context
 * @property {string} extensionId
 * @property {import('@playwright/test').Worker} serviceWorker
 * @property {(page: import('@playwright/test').Page) => Promise<void>} openPopup
 * @property {(rules: object[]) => Promise<void>} seedRules
 */

/** @type {import('@playwright/test').TestType<ExtensionFixtures, {}>} */
export const test = base.extend({
  target: ['chromium', { option: true }],

  extension: async ({ target }, use) => {
    const install = target === 'firefox' ? installInFirefox : installInChromium;
    const extension = await install();
    await use(extension);
    await extension.close();
  },

  context: async ({ extension }, use) => {
    await use(extension.context);
  },

  page: async ({ context }, use) => {
    const page = context.pages()[0] || (await context.newPage());
    await use(page);
  },

  serviceWorker: async ({ extension }, use) => {
    if (!extension.serviceWorker) {
      throw new Error('This browser target has no service worker to inspect');
    }
    await use(extension.serviceWorker);
  },

  extensionId: async ({ extension }, use) => {
    await use(new URL(extension.origin).host);
  },

  openPopup: async ({ extension }, use) => {
    await use(async (page) => {
      if (!extension.canOpenPages) {
        throw new Error('This browser target cannot navigate to extension pages');
      }
      // Extension.js emits the action popup under action/
      await page.goto(`${extension.origin}/action/index.html`);
      await page.waitForFunction(() => !document.body.dataset.loading, null, {
        timeout: 30_000,
      });
    });
  },

  seedRules: async ({ extension }, use) => {
    await use(extension.seedRules);
  },
});

async function installInChromium() {
  const pathToExtension = path.join(root, 'dist', 'chrome');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    // Headless Chromium supports extensions when using Playwright's channel.
    headless: true,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 30_000 });
  }

  return {
    context,
    serviceWorker,
    // Node's URL parser reports `null` as the origin of non-special schemes.
    origin: `chrome-extension://${new URL(serviceWorker.url()).host}`,
    canOpenPages: true,
    seedRules: async (rules) => {
      await serviceWorker.evaluate(async (nextRules) => {
        await chrome.storage.local.set({ rules: nextRules });
      }, rules);
      // Give the background listener a tick to re-serialize into parsedRules.
      await serviceWorker.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    },
    close: () => context.close(),
  };
}

async function installInFirefox() {
  const firefox = await launchFirefoxWithExtension(path.join(root, 'dist', 'firefox'));

  return {
    context: firefox.context,
    origin: firefox.extensionOrigin,
    // Playwright's Firefox cannot navigate to moz-extension:// (or any
    // privileged) document, so popup and options specs skip this target.
    canOpenPages: false,
    seedRules: async (rules) => {
      await firefox.evaluateInBackground(
        `await browser.storage.local.set(${JSON.stringify({ rules })})`
      );
      await firefox.evaluateInBackground(
        'await new Promise((resolve) => setTimeout(resolve, 100))'
      );
    },
    close: () => firefox.close(),
  };
}

/** Skip specs that need to load the extension's own HTML pages. */
export const requiresExtensionPages = (test) =>
  test.skip(
    ({ target }) => target === 'firefox',
    'Playwright cannot navigate to moz-extension:// pages'
  );

export { expect };
