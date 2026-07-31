import type { InjectionRule, NavigationInfo, ParsedRule, Rule } from './types';
import { containsCode } from './utils';

/**
 * Flatten storage rules into injection units (css → html → js).
 * Disabled rules are skipped entirely.
 */
export function serializeRules(rules: Rule[]): ParsedRule[] {
  const result: ParsedRule[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    if (containsCode(rule.code.css)) {
      result.push({
        type: 'css',
        enabled: rule.enabled,
        selector: rule.selector,
        topFrameOnly: rule.topFrameOnly,
        code: rule.code.css,
        onLoad: rule.onLoad,
      });
    }

    if (containsCode(rule.code.html)) {
      result.push({
        type: 'html',
        enabled: rule.enabled,
        selector: rule.selector,
        topFrameOnly: rule.topFrameOnly,
        code: rule.code.html,
        onLoad: rule.onLoad,
      });
    }

    if (containsCode(rule.code.js)) {
      result.push({
        type: 'js',
        enabled: rule.enabled,
        selector: rule.selector,
        topFrameOnly: rule.topFrameOnly,
        code: rule.code.js,
        onLoad: rule.onLoad,
      });
    }
  }

  return result;
}

/** Match parsed rules against a navigation target and prepare inject payloads. */
export function getInvolvedRules(
  info: NavigationInfo,
  rules: ParsedRule[]
): InjectionRule[] {
  const result: InjectionRule[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.topFrameOnly && info.parentFrameId !== -1) continue;

    // A saved pattern can be invalid; skip only that rule instead of letting
    // the throw take down every other rule's injection.
    try {
      if (!new RegExp(rule.selector).test(info.url)) continue;
    } catch {
      continue;
    }

    result.push({
      type: rule.type,
      onLoad: rule.onLoad,
      code: rule.code,
    });
  }

  return result;
}

export function splitRulesByInjectionType(rules: InjectionRule[]): {
  onLoad: InjectionRule[];
  onCommit: InjectionRule[];
} {
  const onLoad: InjectionRule[] = [];
  const onCommit: InjectionRule[] = [];

  for (const rule of rules) {
    if (rule.onLoad) onLoad.push(rule);
    else onCommit.push(rule);
  }

  return { onLoad, onCommit };
}
