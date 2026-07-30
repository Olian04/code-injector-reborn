/**
 * Resolve the extension API namespace.
 * Prefer promise-based `browser` (Firefox / Extension.js polyfill), else `chrome`.
 */
import type BrowserNS from 'webextension-polyfill';

export type ExtApi = BrowserNS.Browser;

export function getExtApi(): ExtApi {
  const g = globalThis as typeof globalThis & {
    browser?: ExtApi;
    chrome?: typeof chrome;
  };

  if (g.browser?.runtime?.id) {
    return g.browser;
  }

  // Chromium exposes `chrome`; Extension.js --polyfill may also set `browser`.
  // Cast: chrome callback APIs are structurally used as promise-based in MV3 /
  // when the polyfill is present.
  if (g.chrome?.runtime?.id) {
    return g.chrome as unknown as ExtApi;
  }

  if (g.browser) return g.browser;
  if (g.chrome) return g.chrome as unknown as ExtApi;

  throw new Error('Extension API (browser/chrome) is unavailable');
}

const browserApi = new Proxy({} as ExtApi, {
  get(_target, prop) {
    const api = getExtApi();
    const value = Reflect.get(api as object, prop, api);
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(api)
      : value;
  },
}) as ExtApi;

export default browserApi;
