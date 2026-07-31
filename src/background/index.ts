import browser from '../shared/browser';
import type BrowserNS from 'webextension-polyfill';
import {
  getInvolvedRules,
  serializeRules,
  splitRulesByInjectionType,
} from '../shared/rules';
import type {
  InjectionRule,
  NavigationInfo,
  ParsedRule,
  Rule,
  Settings,
  TabData,
} from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';

/** Path of the dynamically injected page script (scripts/ special folder). */
const INJECT_SCRIPT = '/scripts/inject.js';

let rules: ParsedRule[] = [];
let settings: Settings = { ...DEFAULT_SETTINGS };
const activeTabsData: Record<number, TabData> = {};
const countTimers: Record<number, ReturnType<typeof setTimeout>> = {};

/** Resolves once storage-backed state is loaded; navigation waits on this. */
let ready: Promise<void> = Promise.resolve();

function createNewTabData(
  info: Pick<NavigationInfo, 'tabId' | 'parentFrameId' | 'url'>,
  reassign?: boolean
): TabData | undefined {
  if (activeTabsData[info.tabId] && reassign !== true) return;

  const tabData: TabData = {
    id: info.tabId,
    top: 0,
    inner: 0,
    topURL: '',
    innerURLs: [],
    getTotal() {
      return this.top + this.inner;
    },
    reset() {
      this.top = 0;
      this.topURL = '';
      this.inner = 0;
      this.innerURLs.length = 0;
    },
  };

  if (info.parentFrameId === -1) {
    tabData.topURL = info.url;
  }

  activeTabsData[info.tabId] = tabData;
  return tabData;
}

function setBadgeCounter(tabData: TabData | undefined): void {
  if (!tabData) return;

  let text = '';
  if (tabData.getTotal) {
    const total = tabData.getTotal();
    text = total ? String(total) : '';
  }
  if (!settings.showcounter) text = '';
  browser.action.setBadgeText({ text, tabId: tabData.id });
}

function countInvolvedRules(tabData: TabData, cb: () => void): void {
  clearTimeout(countTimers[tabData.id]);
  countTimers[tabData.id] = setTimeout(async () => {
    delete countTimers[tabData.id];
    const data = await browser.storage.local.get('rules');
    const stored = (data.rules as Rule[]) || [];
    if (!stored.length && !data.rules) return;

    tabData.top = 0;
    tabData.inner = 0;

    for (const rule of stored) {
      // A saved pattern can be invalid; it must not abort the whole count.
      let selector: RegExp;
      try {
        selector = new RegExp(rule.selector);
      } catch {
        continue;
      }

      if (selector.test(tabData.topURL)) {
        if (rule.enabled) tabData.top++;
      } else {
        if (rule.topFrameOnly) continue;
        for (const url of tabData.innerURLs) {
          if (selector.test(url)) {
            if (rule.enabled) tabData.inner++;
            break;
          }
        }
      }
    }
    cb();
  }, 250);
}

function updateActiveTabsData(
  info: Pick<NavigationInfo, 'tabId' | 'parentFrameId' | 'url'>
): void {
  createNewTabData(info);
  const tabData = activeTabsData[info.tabId];
  if (!tabData) return;

  if (info.parentFrameId === -1) {
    tabData.reset?.();
    tabData.topURL = info.url;
  } else {
    tabData.innerURLs.push(info.url);
  }

  countInvolvedRules(tabData, () => setBadgeCounter(tabData));
}

async function getActiveTab(): Promise<{ id?: number; url?: string } | undefined> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function injectRules(payload: {
  info: Pick<NavigationInfo, 'tabId' | 'frameId'>;
  rules: { onLoad: InjectionRule[]; onCommit: InjectionRule[] };
}): Promise<void> {
  if (
    payload.rules.onLoad.length === 0 &&
    payload.rules.onCommit.length === 0
  ) {
    throw { message: 'No rules to be injected' };
  }
  if (!payload.info) {
    throw { message: 'Unknown tab info.' };
  }

  await browser.scripting.executeScript({
    target: {
      tabId: payload.info.tabId,
      frameIds: [payload.info.frameId],
    },
    files: [INJECT_SCRIPT],
    injectImmediately: true,
  });

  await browser.tabs.sendMessage(payload.info.tabId, payload.rules, {
    frameId: payload.info.frameId,
  });
}

async function handleWebNavigationOnCommitted(
  details: BrowserNS.WebNavigation.OnCommittedDetailsType
): Promise<void> {
  await ready;

  // @types/webextension-polyfill omits parentFrameId on OnCommitted, but
  // Chromium/Firefox provide it at runtime (top-level frames use -1).
  const parentFrameId =
    (details as BrowserNS.WebNavigation.OnCommittedDetailsType & {
      parentFrameId?: number;
    }).parentFrameId ?? -1;

  const info: NavigationInfo = {
    tabId: details.tabId,
    frameId: details.frameId,
    parentFrameId,
    url: details.url,
  };

  updateActiveTabsData(info);

  const involved = getInvolvedRules(info, rules);
  const split = splitRulesByInjectionType(involved);
  try {
    await injectRules({ info, rules: split });
  } catch {
    // No matching rules / inject failure is expected often.
  }
}

function handleActivated(activeInfo: { tabId: number }): void {
  if (activeTabsData[activeInfo.tabId]) {
    setBadgeCounter(activeTabsData[activeInfo.tabId]);
    return;
  }
  browser.tabs.get(activeInfo.tabId).then((tab) => {
    updateActiveTabsData({
      parentFrameId: -1,
      tabId: tab.id!,
      url: tab.url || '',
    });
  });
}

function handleStorageChanged(
  changes: Record<string, { newValue?: unknown }>
): void {
  if ('rules' in changes) {
    const next = (changes.rules.newValue as Rule[]) || [];
    rules = serializeRules(next);
    browser.storage.local.set({ parsedRules: rules });
  }
  if (changes.settings?.newValue) {
    settings = changes.settings.newValue as Settings;
    for (const tabData of Object.values(activeTabsData)) {
      setBadgeCounter(tabData);
    }
  }
}

function handleOnMessage(
  message: unknown,
  _sender: BrowserNS.Runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): true {
  const mex = message as { action: string; rule?: Rule; tabId?: number };
  switch (mex.action) {
    case 'inject':
      getActiveTab().then((tab) => {
        if (!tab?.id) throw new Error('Failed to get the current active tab.');

        const info = { tabId: tab.id, frameId: 0 };
        // Manual inject always runs, even when the saved rule is disabled.
        const serialized = serializeRules([
          { ...mex.rule!, enabled: true },
        ]);
        const split = splitRulesByInjectionType(
          serialized.map((r) => ({
            type: r.type,
            onLoad: r.onLoad,
            code: r.code,
          }))
        );

        injectRules({ info, rules: split })
          .then(() =>
            browser.runtime.sendMessage({ action: mex.action, success: true })
          )
          .catch((err) =>
            browser.runtime.sendMessage({
              action: mex.action,
              success: false,
              error: err,
            })
          );
      });
      break;

    case 'get-current-tab-data': {
      const activeTabData = activeTabsData[mex.tabId!];
      const sendData = (data: TabData | Record<string, unknown>) => {
        const tabData = JSON.parse(JSON.stringify(data || {}));
        browser.runtime.sendMessage({
          action: mex.action,
          data: tabData,
        });
      };

      if (activeTabData?.topURL) {
        sendData(activeTabData);
      } else {
        getActiveTab().then((tab) => {
          const tabData = createNewTabData(
            {
              parentFrameId: -1,
              tabId: tab?.id || -1,
              url: tab?.url || '',
            },
            true
          )!;
          countInvolvedRules(tabData, () => sendData(tabData));
        });
      }
      break;
    }
  }

  sendResponse();
  return true;
}

async function initialize(): Promise<void> {
  const data = await browser.storage.local.get();
  if (data.parsedRules) {
    rules = data.parsedRules as ParsedRule[];
  } else if (data.rules) {
    // Cold start without cached parsedRules (e.g. after clear / first install).
    rules = serializeRules(data.rules as Rule[]);
  }
  if (data.settings) {
    settings = data.settings as Settings;
  }
}

ready = initialize();

browser.storage.onChanged.addListener(handleStorageChanged);
browser.tabs.onActivated.addListener(handleActivated);
browser.webNavigation.onCommitted.addListener(handleWebNavigationOnCommitted);
browser.runtime.onMessage.addListener(handleOnMessage);
