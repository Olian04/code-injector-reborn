import { useEffect, useRef, useState } from 'react';
import { stripHTMLFromString } from '../../shared/utils';
import {
  getGitHubRule,
  getGitHubRuleInfo,
  getLocalRules,
  getRemoteRules,
  type GitHubRuleInfo,
} from '../importHelpers';
import type { ImportResult } from '../../shared/legacy-import';

interface ImportModalProps {
  onDone: (result: 'success' | 'fail', detail: string) => void;
}

export function ImportModal({ onDone }: ImportModalProps) {
  const [method, setMethod] = useState('0');
  const [fileValue, setFileValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [remote, setRemote] = useState('');
  const [github, setGithub] = useState('');
  const [validGithub, setValidGithub] = useState(false);
  const [githubPayload, setGithubPayload] = useState<string>('');
  const [githubPreview, setGithubPreview] = useState<{
    name: string;
    author: string;
    description: string;
    icon?: string;
    hasJS: boolean;
    hasCSS: boolean;
    hasHTML: boolean;
  } | null>(null);
  const [canImport, setCanImport] = useState(false);
  const githubInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remoteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let enable = false;
    if (method === '0') {
      enable = !!(fileValue && fileInputRef.current?.validity.valid);
    } else if (method === '1') {
      enable = !!remote;
    } else if (method === '2') {
      enable = validGithub;
    }
    setCanImport(enable);
  }, [method, fileValue, remote, validGithub]);

  useEffect(() => {
    if (method === '0') fileInputRef.current?.focus();
    else if (method === '1') remoteInputRef.current?.focus();
    else if (method === '2') githubInputRef.current?.focus();
  }, [method]);

  const resetPanels = () => {
    setFileValue('');
    setFile(null);
    setRemote('');
    setGithub('');
    setValidGithub(false);
    setGithubPayload('');
    setGithubPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMethodChange = (value: string) => {
    resetPanels();
    setMethod(value);
  };

  const handleGithubInput = (value: string) => {
    setGithub(value);
    setValidGithub(false);
    setGithubPayload('');
    setGithubPreview(null);

    getGitHubRuleInfo(value)
      .then((res) => {
        if (!res.valid) return;

        const json = res.json;
        const ruleName =
          stripHTMLFromString(String(json.name || '')).trim() ||
          'Unnamed Remote Rule';
        const ruleAuthor =
          stripHTMLFromString(String(json.author || '')).trim() ||
          res.url.split('/')[3];
        const ruleDescription =
          stripHTMLFromString(String(json.description || '')).trim() || '';
        const ruleIcon = json.icon && String(json.icon).trim();
        const ruleHasJS = !!(json.code && json.code.js);
        const ruleHasCSS = !!(json.code && json.code.css);
        const ruleHasHTML = !!(json.code && json.code.html);

        setGithubPreview({
          name: ruleName,
          author: ruleAuthor,
          description: ruleDescription,
          icon: ruleIcon || undefined,
          hasJS: ruleHasJS,
          hasCSS: ruleHasCSS,
          hasHTML: ruleHasHTML,
        });
        setGithubPayload(JSON.stringify(res));
        setValidGithub(res.valid);
      })
      .catch(() => {
        // ignore validation errors while typing
      });
  };

  const finish = (res: ImportResult | null) => {
    if (res && res.imported > 0) {
      onDone('success', res.imported + ' / ' + res.total);
    } else if (res) {
      onDone('fail', res.imported + ' / ' + res.total);
    } else {
      onDone('fail', 'Failed');
    }
  };

  const handleImport = () => {
    let p: Promise<ImportResult | null>;

    switch (method) {
      case '0':
        p = getLocalRules(file);
        break;
      case '1':
        p = getRemoteRules(remote);
        break;
      case '2':
        try {
          const parsed = JSON.parse(githubPayload) as Extract<
            GitHubRuleInfo,
            { valid: true }
          >;
          p = getGitHubRule(parsed);
        } catch {
          p = Promise.reject();
        }
        break;
      default:
        p = Promise.reject();
    }

    p.then(finish, () => onDone('fail', 'Failed'));
  };

  return (
    <>
      <ul className="import-methods">
        <li data-for="0" data-active={method === '0' ? 'true' : 'false'}>
          <input
            ref={fileInputRef}
            type="file"
            data-name="inp-import-file"
            accept="*.json"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              setFileValue(e.target.value);
            }}
          />
        </li>
        <li data-for="1" data-active={method === '1' ? 'true' : 'false'}>
          <input
            ref={remoteInputRef}
            type="text"
            data-name="inp-import-remote"
            className="inp"
            placeholder="Type the Remote JSON link here..."
            value={remote}
            onChange={(e) => setRemote(e.target.value)}
          />
        </li>
        <li data-for="2" data-active={method === '2' ? 'true' : 'false'}>
          <input
            ref={githubInputRef}
            type="text"
            data-name="inp-import-github"
            className="inp"
            placeholder="Type the GitHub link here..."
            value={github}
            data-validgithub={validGithub ? 'true' : 'false'}
            onChange={(e) => handleGithubInput(e.target.value)}
          />
          <div className="import-github-info">
            {githubPreview && (
              <>
                <table
                  title={githubPreview.description || undefined}
                >
                  <tbody>
                    <tr>
                      <td rowSpan={2} style={{ width: '1%' }}>
                        <div
                          className="import-gh-icon"
                          style={
                            githubPreview.icon
                              ? {
                                  backgroundImage:
                                    'url(' + githubPreview.icon + ')',
                                }
                              : undefined
                          }
                        />
                        <ul className="import-gh-codes">
                          <li
                            className="color color-js"
                            title="JavaScript"
                            data-active={githubPreview.hasJS ? 'true' : 'false'}
                          />
                          <li
                            className="color color-css"
                            title="CSS"
                            data-active={githubPreview.hasCSS ? 'true' : 'false'}
                          />
                          <li
                            className="color color-html"
                            title="HTML"
                            data-active={
                              githubPreview.hasHTML ? 'true' : 'false'
                            }
                          />
                        </ul>
                      </td>
                      <th>
                        <div className="import-gh-name">{githubPreview.name}</div>
                      </th>
                    </tr>
                    <tr>
                      <td>
                        <div className="import-gh-author">
                          {githubPreview.author}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <textarea readOnly value={githubPayload} />
              </>
            )}
          </div>
        </li>
      </ul>
      <div className="import-controls">
        <select
          data-name="sel-import-method"
          value={method}
          onChange={(e) => handleMethodChange(e.target.value)}
        >
          <option value="0">Local JSON file</option>
          <option value="1">Remote JSON file</option>
          <option value="2">GitHub repository</option>
        </select>
        <button
          className="btn btn-primary"
          data-name="btn-import"
          disabled={!canImport}
          onClick={handleImport}
        >
          Import
        </button>
      </div>
    </>
  );
}
