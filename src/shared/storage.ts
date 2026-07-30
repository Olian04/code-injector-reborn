import browser from './browser';
import { isThemePreference } from './theme';
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
  const stored = data.settings as Partial<Settings> | undefined;
  const settings = { ...DEFAULT_SETTINGS, ...stored };

  // Settings saved before the theme selector existed only carry the original
  // addon's night mode flag.
  if (!isThemePreference(stored?.theme)) {
    settings.theme = stored?.nightmode ? 'dark' : 'auto';
  }

  return settings;
}

export async function setSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEYS.settings]: settings });
}
