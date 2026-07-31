import type { Rule } from './types';

/** Convert a legacy JS-Injector rule into a Code-Injector rule. */
export function convertRuleJSItoCI(legacy: {
  url: string;
  enabled: boolean;
  code: string;
}): Rule {
  return {
    selector: legacy.url,
    enabled: legacy.enabled,
    onLoad: true,
    topFrameOnly: false,
    code: {
      js: legacy.code,
      css: '',
      html: '',
    },
  };
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
        }
      ) as unknown as Record<string, unknown>;
    }

    // Exports from the original addon carry a `files` list; it is ignored.
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
      },
    };

    if (rule.selector === undefined) continue;
    if (rule.enabled === undefined) continue;
    if (typeof rule.code.js !== 'string') continue;
    if (typeof rule.code.css !== 'string') continue;
    if (typeof rule.code.html !== 'string') continue;

    newRules.push(rule);
  }

  return newRules;
}
