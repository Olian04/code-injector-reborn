import type { Rule } from './types';
import { getPathExtension, isLocalURL } from './utils';

/** Convert a legacy JS-Injector rule into a Code-Injector rule. */
export function convertRuleJSItoCI(legacy: {
  url: string;
  enabled: boolean;
  code: string;
  files: Array<{ url: string }>;
}): Rule {
  const rule: Rule = {
    selector: legacy.url,
    enabled: legacy.enabled,
    onLoad: true,
    topFrameOnly: false,
    code: {
      js: legacy.code,
      css: '',
      html: '',
      files: [],
    },
  };

  for (const file of legacy.files || []) {
    rule.code.files.push({
      path: file.url,
      type: isLocalURL(file.url) ? 'local' : 'remote',
      ext: getPathExtension(file.url),
    });
  }

  return rule;
}

export interface ImportResult {
  imported: number;
  total: number;
}

/**
 * Validate and normalize an imported rules array.
 * Returns null if the payload is not a valid rules list.
 */
export function parseImportedRules(raw: unknown): Rule[] | null {
  if (!raw || !Array.isArray(raw)) return null;

  const newRules: Rule[] = [];

  for (let loadedRule of raw as Array<Record<string, unknown>>) {
    // Legacy JS-Injector shape
    if (
      Object.keys(loadedRule).length === 4 &&
      typeof loadedRule.url === 'string' &&
      typeof loadedRule.code === 'string' &&
      typeof loadedRule.enabled === 'boolean' &&
      typeof loadedRule.files === 'object'
    ) {
      loadedRule = convertRuleJSItoCI(
        loadedRule as {
          url: string;
          enabled: boolean;
          code: string;
          files: Array<{ url: string }>;
        }
      ) as unknown as Record<string, unknown>;
    }

    const code = loadedRule.code as Rule['code'] | undefined;
    if (!code) continue;

    const rule: Rule = {
      selector: loadedRule.selector as string,
      enabled: loadedRule.enabled as boolean,
      onLoad: loadedRule.onLoad as boolean,
      topFrameOnly: loadedRule.topFrameOnly as boolean,
      code: {
        js: code.js,
        css: code.css,
        html: code.html,
        files: code.files,
      },
    };

    if (rule.selector === undefined) continue;
    if (rule.enabled === undefined) continue;
    if (typeof rule.code.js !== 'string') continue;
    if (typeof rule.code.css !== 'string') continue;
    if (typeof rule.code.html !== 'string') continue;
    if (!(rule.code.files && Array.isArray(rule.code.files))) continue;

    newRules.push(rule);
  }

  return newRules;
}
