import browser from './browser';
import type { Rule, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

export const STORAGE_KEYS = {
  rules: 'rules',
  parsedRules: 'parsedRules',
  settings: 'settings',
  lastSession: 'lastSession',
} as const;

export async function getRules(): Promise<Rule[]> {
  const data = await browser.storage.local.get(STORAGE_KEYS.rules);
  return (data.rules as Rule[]) || [];
}

export async function setRules(rules: Rule[]): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.rules]: rules });
}

export async function getSettings(): Promise<Settings> {
  const data = await browser.storage.local.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(data.settings as Settings | undefined) };
}

export async function setSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.settings]: settings });
}
