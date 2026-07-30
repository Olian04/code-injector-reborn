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

/** Path of the dynamically injected page script (scripts/ special folder). */
const INJECT_SCRIPT = '/scripts/inject.js';

let rules: ParsedRule[] = [];
let settings: Settings = {
  nightmode: false,
  showcounter: false,
  size: { width: 500, height: 500 },
};
const activeTabsData: Record<number, TabData> = {};

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
  let text = '';
  if (tabData?.getTotal) {
    const total = tabData.getTotal();
    text = total ? String(total) : '';
  }
  if (!settings.showcounter) text = '';
  browser.action.setBadgeText({ text });
}

let countTimer: ReturnType<typeof setTimeout> | undefined;

function countInvolvedRules(tabData: TabData, cb: () => void): void {
  clearTimeout(countTimer);
  countTimer = setTimeout(async () => {
    const data = await browser.storage.local.get('rules');
    const stored = (data.rules as Rule[]) || [];
    if (!stored.length && !data.rules) return;

    tabData.top = 0;
    tabData.inner = 0;

    for (const rule of stored) {
      if (new RegExp(rule.selector).test(tabData.topURL)) {
        if (rule.enabled) tabData.top++;
      } else {
        if (rule.topFrameOnly) continue;
        for (const url of tabData.innerURLs) {
          if (new RegExp(rule.selector).test(url)) {
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
  if (changes.rules?.newValue) {
    rules = serializeRules(changes.rules.newValue as Rule[]);
    browser.storage.local.set({ parsedRules: rules });
  }
  if (changes.settings?.newValue) {
    settings = changes.settings.newValue as Settings;
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
        const serialized = serializeRules([mex.rule!]);
        const involved = getInvolvedRules(
          { ...info, parentFrameId: -1, url: tab.url || '' },
          serialized
        );
        // Manual inject: force through same path; serializeRules already filtered.
        // Original forced both buckets via split of serializeRules output.
        const split = splitRulesByInjectionType(
          serialized.map((r) => {
            if (r.path) {
              if (r.local) {
                return {
                  type: 'js' as const,
                  onLoad: r.onLoad,
                  code: "console.error('Code-Injector [ERROR]: local file injection is no longer supported in Manifest V3. Use a remote URL or paste the code directly instead.')",
                };
              }
              return {
                type: r.type,
                onLoad: r.onLoad,
                path: r.path,
              };
            }
            return {
              type: r.type,
              onLoad: r.onLoad,
              code: r.code,
            };
          })
        );

        // Use involved for URL match? Original used serializeRules + split without URL re-match for manual inject.
        void involved;
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
  }
  if (data.settings) {
    settings = data.settings as Settings;
  }
}

browser.storage.onChanged.addListener(handleStorageChanged);
browser.tabs.onActivated.addListener(handleActivated);
browser.webNavigation.onCommitted.addListener(handleWebNavigationOnCommitted);
browser.runtime.onMessage.addListener(handleOnMessage);

void initialize();
