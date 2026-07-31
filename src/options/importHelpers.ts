import { parseImportedRules, type ImportResult } from '../shared/legacy-import';
import { getRules, setRules } from '../shared/storage';
import type { Rule } from '../shared/types';
import { parseURL } from '../shared/utils';

export async function importRules(raw: unknown): Promise<ImportResult | null> {
  const newRules = parseImportedRules(raw);
  if (!newRules) return null;

  const existing = await getRules();
  await setRules([...existing, ...newRules]);

  return {
    imported: newRules.length,
    total: Array.isArray(raw) ? raw.length : 0,
  };
}

export type GitHubRuleInfo =
  | { valid: true; url: string; json: GitHubRuleJson }
  | { valid: false; error: string };

export interface GitHubRuleJson {
  name?: string;
  description?: string;
  author?: string;
  icon?: string;
  selector?: string;
  onLoad?: boolean;
  topFrameOnly?: boolean;
  code?: {
    js?: string;
    css?: string;
    html?: string;
  };
}

let githubCheckTimeout: ReturnType<typeof setTimeout> | null = null;

export function getGitHubRuleInfo(_link: string): Promise<GitHubRuleInfo> {
  if (githubCheckTimeout) clearTimeout(githubCheckTimeout);

  return new Promise((ok, ko) => {
    githubCheckTimeout = setTimeout(() => {
      const link = parseURL(_link);

      if (!link) {
        ko({ valid: false, error: 'INVALID_LINK' });
        return;
      }

      if (link.origin !== 'https://github.com') {
        ko({ valid: false, error: 'GITHUB_ONLY' });
        return;
      }

      const requestURL = 'https://raw.githubusercontent.com' + link.pathname;

      fetch(requestURL + '/master/rule.json')
        .then((res) => {
          if (res.status !== 200) throw res.status;
          return res.json();
        })
        .then(
          (json: GitHubRuleJson) => {
            ok({ valid: true, url: requestURL, json });
          },
          (err: unknown) => {
            if (err === 404) {
              ko({ valid: false, error: 'NOT_FOUND' });
              return;
            }
            ko({ valid: false, error: 'JSON_PARSE_FAIL' });
          }
        );
    }, 500);
  });
}

export async function getGitHubRule(data: {
  url: string;
  json: GitHubRuleJson;
}): Promise<ImportResult | null> {
  if (!data || typeof data !== 'object') throw new Error('INVALID_DATA');

  const remoteConfig = data.json;
  if (!remoteConfig.code) throw new Error('NO_CODES');

  const stripLeadingSlash = (p: string) => p.replace(/^\//, '');

  const remoteUrlJS = remoteConfig.code.js
    ? data.url + '/master/' + stripLeadingSlash(remoteConfig.code.js)
    : null;
  const remoteUrlCSS = remoteConfig.code.css
    ? data.url + '/master/' + stripLeadingSlash(remoteConfig.code.css)
    : null;
  const remoteUrlHTML = remoteConfig.code.html
    ? data.url + '/master/' + stripLeadingSlash(remoteConfig.code.html)
    : null;

  const newRule: Rule = {
    selector: remoteConfig.selector || '',
    onLoad: !!remoteConfig.onLoad,
    topFrameOnly: !!remoteConfig.topFrameOnly,
    enabled: true,
    code: {
      js: '',
      css: '',
      html: '',
    },
  };

  const requestFile = async (
    link: string | null,
    type: 'js' | 'css' | 'html'
  ) => {
    if (!link) return;
    try {
      const res = await fetch(link);
      const code = await res.text();
      if (code) newRule.code[type] = code;
    } catch {
      // failed to fetch
    }
  };

  await requestFile(remoteUrlJS, 'js');
  await requestFile(remoteUrlCSS, 'css');
  await requestFile(remoteUrlHTML, 'html');

  return importRules([newRule]);
}

export async function getRemoteRules(_link: string): Promise<ImportResult | null> {
  if (!/\.json$/.test(_link)) throw new Error('NOT_JSON');

  const res = await fetch(_link);
  const json = await res.json();
  return importRules(json);
}

export function getLocalRules(file: File | undefined | null): Promise<ImportResult | null> {
  return new Promise((ok, ko) => {
    if (!file) {
      ko();
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('loadend', function () {
      try {
        const rulesJSON = JSON.parse(String(this.result));
        importRules(rulesJSON).then(ok, ko);
      } catch {
        ko();
      }
    });
    reader.addEventListener('error', () => ko());
    reader.readAsText(file);
  });
}
