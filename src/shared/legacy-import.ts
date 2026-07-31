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

    if (typeof loadedRule.selector !== 'string') continue;
    if (typeof loadedRule.enabled !== 'boolean') continue;
    if (typeof code.js !== 'string') continue;
    if (typeof code.css !== 'string') continue;
    if (typeof code.html !== 'string') continue;

    const rule: Rule = {
      selector: loadedRule.selector,
      enabled: loadedRule.enabled,
      // Match emptyRule() defaults when older exports omit these flags.
      onLoad: typeof loadedRule.onLoad === 'boolean' ? loadedRule.onLoad : true,
      topFrameOnly:
        typeof loadedRule.topFrameOnly === 'boolean'
          ? loadedRule.topFrameOnly
          : true,
      code: {
        js: code.js,
        css: code.css,
        html: code.html,
      },
    };

    newRules.push(rule);
  }

  return newRules;
}
