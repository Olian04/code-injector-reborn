import type { ThemePreference } from './theme';

export type FileExt = 'js' | 'css' | 'html' | '';

export type FileType = 'local' | 'remote' | '';

export interface RuleFile {
  path: string;
  type: FileType;
  ext: FileExt;
}

export interface RuleCode {
  js: string;
  css: string;
  html: string;
  files: RuleFile[];
}

export interface Rule {
  selector: string;
  enabled: boolean;
  onLoad: boolean;
  topFrameOnly: boolean;
  code: RuleCode;
}

export interface ParsedRule {
  type: 'js' | 'css' | 'html';
  enabled: boolean;
  selector: string;
  topFrameOnly: boolean;
  onLoad: boolean;
  code?: string;
  path?: string;
  local?: boolean;
}

export interface InjectionRule {
  type: 'js' | 'css' | 'html';
  onLoad: boolean;
  code?: string;
  path?: string;
}

export interface Settings {
  /** Kept for compatibility with rule files exported by the original addon. */
  nightmode: boolean;
  theme: ThemePreference;
  showcounter: boolean;
  size: {
    width: number;
    height: number;
  };
}

export interface TabData {
  id: number;
  top: number;
  inner: number;
  topURL: string;
  innerURLs: string[];
  getTotal?: () => number;
  reset?: () => void;
}

export interface NavigationInfo {
  tabId: number;
  frameId: number;
  parentFrameId: number;
  url: string;
}

export const DEFAULT_SETTINGS: Settings = {
  nightmode: false,
  theme: 'auto',
  showcounter: false,
  size: {
    width: 500,
    height: 500,
  },
};

export function emptyRule(): Rule {
  return {
    selector: '',
    enabled: true,
    onLoad: true,
    topFrameOnly: true,
    code: {
      js: '',
      css: '',
      html: '',
      files: [],
    },
  };
}
