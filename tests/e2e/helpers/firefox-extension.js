import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { firefox } from '@playwright/test';

/**
 * Firefox extension support for Playwright.
 *
 * Playwright has no API for installing add-ons (microsoft/playwright#7297), so
 * this mirrors what `web-ext run` does: launch Firefox with the DevTools remote
 * debugging server enabled, then ask its add-ons actor to install the built
 * directory as a temporary add-on. Temporary add-ons need no signing, which is
 * what makes this work for a local build.
 *
 * The same connection doubles as the test's way into the extension: Playwright
 * cannot open `moz-extension://` documents, so rules are seeded by evaluating
 * code in the background script over the protocol instead.
 */

/** Must match browser_specific_settings.gecko.id in src/manifest.json. */
export const FIREFOX_ADDON_ID = 'code-injector-reborn@olian04';

/**
 * moz-extension origins are random per profile. Pinning the UUID up front lets
 * tests build extension URLs without discovering them at runtime.
 */
export const FIREFOX_EXTENSION_UUID = '5f8c1a2e-7d34-4b96-9a5e-2c6b7f0d1e83';

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/**
 * Minimal Firefox Remote Debugging Protocol client: packets are the JSON body
 * prefixed with its byte length and a colon. Requests here are sequential, so a
 * single pending resolver is enough.
 */
class RdpClient {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.pending = null;
    this.greeted = false;
    this.events = [];
    // The server opens with an unsolicited hello packet, also `from: root`.
    this.ready = new Promise((resolve) => {
      this.onGreeting = resolve;
    });
    socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.drain();
    });
  }

  static async connect(port, { attempts = 100, interval = 150 } = {}) {
    for (let i = 0; i < attempts; i++) {
      try {
        const socket = await new Promise((resolve, reject) => {
          const s = net.connect(port, '127.0.0.1');
          s.once('connect', () => resolve(s));
          s.once('error', reject);
        });
        const client = new RdpClient(socket);
        await client.ready;
        return client;
      } catch (err) {
        if (err.code !== 'ECONNREFUSED') throw err;
        await new Promise((r) => setTimeout(r, interval));
      }
    }
    throw new Error(
      `Could not reach the Firefox debugger server on port ${port}. ` +
        'Playwright launched the browser, but --start-debugger-server did not open.'
    );
  }

  drain() {
    for (;;) {
      const separator = this.buffer.indexOf(0x3a); // ':'
      if (separator === -1) return;
      const length = Number(this.buffer.subarray(0, separator).toString());
      if (!Number.isInteger(length)) {
        throw new Error(`Malformed RDP packet: ${this.buffer.subarray(0, 40)}`);
      }
      const start = separator + 1;
      if (this.buffer.length < start + length) return;
      const packet = JSON.parse(this.buffer.subarray(start, start + length).toString());
      this.buffer = this.buffer.subarray(start + length);
      this.handle(packet);
    }
  }

  handle(packet) {
    if (!this.greeted) {
      this.greeted = true;
      this.onGreeting();
      return;
    }
    // Replies carry only `from`; notifications also carry `type`.
    if (packet.type) {
      this.events.push(packet);
      return;
    }
    if (!this.pending) return;
    if (packet.from !== this.pending.actor) return;
    const { resolve, reject } = this.pending;
    this.pending = null;
    if (packet.error) reject(new Error(`${packet.error}: ${packet.message}`));
    else resolve(packet);
  }

  request(message) {
    if (this.pending) throw new Error('RDP requests must be sequential');
    const body = JSON.stringify(message);
    return new Promise((resolve, reject) => {
      this.pending = { actor: message.to, resolve, reject };
      this.socket.write(`${Buffer.byteLength(body)}:${body}`);
    });
  }

  /** Wait for a notification packet, e.g. a target appearing or an eval result. */
  async waitForEvent(predicate, { timeout = 15_000 } = {}) {
    const deadline = Date.now() + timeout;
    for (;;) {
      const found = this.events.find(predicate);
      if (found) return found;
      if (Date.now() > deadline) throw new Error('Timed out waiting for an RDP event');
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  close() {
    this.socket.destroy();
  }
}

/**
 * Manifest V3 host permissions are opt-in on Firefox, so an unattended profile
 * would install the add-on with no access to any site. Seeding the profile's
 * extension-preferences.json grants them the way clicking "Allow" would.
 */
async function grantHostPermissions(userDataDir, addonId, origins) {
  await fs.mkdir(userDataDir, { recursive: true });
  await fs.writeFile(
    path.join(userDataDir, 'extension-preferences.json'),
    JSON.stringify({ [addonId]: { permissions: origins, origins } })
  );
}

/**
 * Launch Firefox with the built extension installed.
 *
 * @param {string} extensionPath unpacked build directory (dist/firefox)
 * @returns {Promise<{
 *   context: import('@playwright/test').BrowserContext,
 *   extensionOrigin: string,
 *   evaluateInBackground: (expression: string) => Promise<unknown>,
 *   close: () => Promise<void>,
 * }>}
 */
export async function launchFirefoxWithExtension(extensionPath) {
  const port = await findFreePort();
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ci-firefox-'));
  await grantHostPermissions(userDataDir, FIREFOX_ADDON_ID, ['<all_urls>']);

  const context = await firefox.launchPersistentContext(userDataDir, {
    headless: true,
    args: ['--start-debugger-server', String(port)],
    firefoxUserPrefs: {
      'devtools.debugger.remote-enabled': true,
      'devtools.debugger.prompt-connection': false,
      'extensions.manifestV3.enabled': true,
      'extensions.webextensions.uuids': JSON.stringify({
        [FIREFOX_ADDON_ID]: FIREFOX_EXTENSION_UUID,
      }),
    },
  });

  const client = await RdpClient.connect(port);
  const root = await client.request({ to: 'root', type: 'getRoot' });
  if (!root.addonsActor) {
    client.close();
    throw new Error('This Firefox build exposes no add-ons actor.');
  }
  await client.request({
    to: root.addonsActor,
    type: 'installTemporaryAddon',
    addonPath: path.resolve(extensionPath),
  });

  const consoleActor = await attachToBackgroundScript(client, FIREFOX_ADDON_ID);

  return {
    context,
    extensionOrigin: `moz-extension://${FIREFOX_EXTENSION_UUID}`,

    /**
     * Run an expression inside the extension's background script, the way
     * Chromium tests use `serviceWorker.evaluate`. Playwright cannot reach
     * extension contexts in Firefox, so this goes through the debugger.
     */
    async evaluateInBackground(expression) {
      const { resultID } = await client.request({
        to: consoleActor,
        type: 'evaluateJSAsync',
        // DevTools wraps top-level `await` on the client side and asks the
        // server to unwrap the resulting promise via `mapped.await`.
        text: `(async () => { return (${expression}); })()`,
        mapped: { await: true },
      });
      const result = await client.waitForEvent(
        (packet) => packet.type === 'evaluationResult' && packet.resultID === resultID
      );
      if (result.exceptionMessage) {
        throw new Error(`Background evaluation failed: ${result.exceptionMessage}`);
      }
      return result.result;
    },

    async close() {
      // The add-on lives as long as this debugger session, so hold the socket
      // open until the context is done with it.
      client.close();
      await context.close();
      await fs.rm(userDataDir, { recursive: true, force: true });
    },
  };
}

/**
 * Firefox 153 dropped `getTarget` on add-on descriptors; targets now arrive as
 * watcher notifications. Returns the console actor for the background script.
 */
async function attachToBackgroundScript(client, addonId) {
  const { addons } = await client.request({ to: 'root', type: 'listAddons' });
  const addon = addons.find((entry) => entry.id === addonId);
  if (!addon) throw new Error(`Add-on ${addonId} is not installed`);

  const { actor: watcher } = await client.request({
    to: addon.actor,
    type: 'getWatcher',
  });
  await client.request({ to: watcher, type: 'watchTargets', targetType: 'frame' });

  // The watcher also reports a devtools fallback document, which has no
  // extension APIs; the background page is the one we want.
  const available = await client.waitForEvent(
    (packet) =>
      packet.type === 'target-available-form' &&
      packet.target?.consoleActor &&
      packet.target.url?.includes('_generated_background_page.html')
  );
  return available.target.consoleActor;
}
