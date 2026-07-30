import type { Rule, RuleFile, TabData } from '../shared/types';

export type EditorTab = 'js' | 'css' | 'html' | 'files';

export interface RuleView extends Rule {
  id: number;
}

export interface EditorState {
  target: string;
  enabled: boolean;
  onLoad: boolean;
  topFrameOnly: boolean;
  selector: string;
  code: {
    js: string;
    css: string;
    html: string;
    files: RuleFile[];
  };
}

export interface CtxMenuState {
  visible: boolean;
  hiding: boolean;
  x: number;
  y: number;
  reversed: boolean;
  ruleId: number | null;
  enabled: boolean;
}

export type InjectFeedback = 'success' | 'fail' | null;

export const EMPTY_TAB_DATA: Pick<TabData, 'topURL' | 'innerURLs'> = {
  topURL: '',
  innerURLs: [],
};

export function ruleMatchesTab(
  selector: string,
  topFrameOnly: boolean,
  tab: Pick<TabData, 'topURL' | 'innerURLs'>
): { active: boolean; innerActive: boolean } {
  let active = false;
  let innerActive = false;

  try {
    const re = new RegExp(selector.trim());
    active = re.test(tab.topURL);
    if (!topFrameOnly) {
      for (const url of tab.innerURLs) {
        if (re.test(url)) {
          innerActive = true;
          break;
        }
      }
    }
  } catch {
    active = false;
  }

  return { active, innerActive };
}

export const DEFAULT_NEW_RULE: EditorState = {
  target: 'NEW',
  onLoad: true,
  topFrameOnly: true,
  enabled: true,
  selector: '',
  code: {
    js: '// Type your JavaScript code here.\n\n',
    css: '/* Type your CSS code here. */\n\n',
    html: '<!-- Type your HTML code here. -->\n\n',
    files: [],
  },
};
