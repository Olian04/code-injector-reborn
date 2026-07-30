import { useEffect, useRef, type MouseEvent, type RefObject } from 'react';
import type { EditorTab } from '../types';
import { FilesList, type EditorFile } from './FilesList';

interface EditorPanelProps {
  target: string;
  selector: string;
  selectorActive: boolean;
  selectorError: boolean;
  selectedTab: EditorTab;
  tabFocus: boolean;
  enabled: boolean;
  onLoad: boolean;
  topFrameOnly: boolean;
  files: EditorFile[];
  codeActive: {
    js: boolean;
    css: boolean;
    html: boolean;
    files: boolean;
  };
  editorJsRef: RefObject<HTMLDivElement>;
  editorCssRef: RefObject<HTMLDivElement>;
  editorHtmlRef: RefObject<HTMLDivElement>;
  tabContentsRef: RefObject<HTMLDivElement>;
  onSelectorChange: (value: string) => void;
  onTabSelect: (tab: EditorTab) => void;
  onEnabledChange: (v: boolean) => void;
  onOnLoadChange: (v: boolean) => void;
  onTopFrameOnlyChange: (v: boolean) => void;
  onFilesChange: (files: EditorFile[]) => void;
  onCancel: () => void;
  onSave: () => void;
  onGetHost: () => void;
  onFilesDirty: () => void;
  onFileGripMouseDown: (e: MouseEvent) => void;
  onResizeGripMouseDown: (e: MouseEvent) => void;
}

export function EditorPanel({
  target,
  selector,
  selectorActive,
  selectorError,
  selectedTab,
  tabFocus,
  enabled,
  onLoad,
  topFrameOnly,
  files,
  codeActive,
  editorJsRef,
  editorCssRef,
  editorHtmlRef,
  tabContentsRef,
  onSelectorChange,
  onTabSelect,
  onEnabledChange,
  onOnLoadChange,
  onTopFrameOnlyChange,
  onFilesChange,
  onCancel,
  onSave,
  onGetHost,
  onFilesDirty,
  onFileGripMouseDown,
  onResizeGripMouseDown,
}: EditorPanelProps) {
  const selectorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      selectorRef.current?.focus();
    }, 400);
    return () => window.clearTimeout(t);
  }, [target]);

  return (
    <div id="editor" data-target={target}>
      <div className="editor-selector">
        <table>
          <tbody>
            <tr>
              <td>
                <input
                  ref={selectorRef}
                  type="text"
                  data-name="txt-editor-selector"
                  className="inp"
                  placeholder="URL pattern (regular expression)"
                  value={selector}
                  data-active={String(selectorActive)}
                  data-error={String(selectorError)}
                  onChange={(e) => onSelectorChange(e.target.value)}
                />
                <i
                  className="e-s-help material-icons"
                  tabIndex={-1}
                  title="The URL pattern specifies in what pages the rule should be applied."
                >
                  &#xE8FD;
                </i>
              </td>
              <td>
                <button
                  data-name="btn-editor-gethost"
                  className="btn"
                  tabIndex={-1}
                  type="button"
                  onClick={onGetHost}
                >
                  Current host
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        className="tab"
        data-selected={selectedTab}
        data-focus={tabFocus ? 'true' : undefined}
      >
        <ul className="tab-titles unselectable">
          <li
            data-name="btn-tab"
            data-for="js"
            onClick={() => onTabSelect('js')}
          >
            JavaScript{' '}
            <span className="color-js" data-active={String(codeActive.js)} />
          </li>
          <li
            data-name="btn-tab"
            data-for="css"
            onClick={() => onTabSelect('css')}
          >
            CSS{' '}
            <span className="color-css" data-active={String(codeActive.css)} />
          </li>
          <li
            data-name="btn-tab"
            data-for="html"
            onClick={() => onTabSelect('html')}
          >
            HTML{' '}
            <span
              className="color-html"
              data-active={String(codeActive.html)}
            />
          </li>
          <li
            data-name="btn-tab"
            data-for="files"
            onClick={() => onTabSelect('files')}
          >
            Files{' '}
            <span
              className="color-files"
              data-active={String(codeActive.files)}
            />
          </li>
        </ul>
        <div className="tab-contents" ref={tabContentsRef}>
          <ul>
            <li
              data-target="js"
              data-selected={selectedTab === 'js' ? 'true' : undefined}
            >
              <div className="editor" id="editor-js" ref={editorJsRef} />
            </li>
            <li
              data-target="css"
              data-selected={selectedTab === 'css' ? 'true' : undefined}
            >
              <div className="editor" id="editor-css" ref={editorCssRef} />
            </li>
            <li
              data-target="html"
              data-selected={selectedTab === 'html' ? 'true' : undefined}
            >
              <div className="editor" id="editor-html" ref={editorHtmlRef} />
            </li>
            <li
              data-target="files"
              data-selected={selectedTab === 'files' ? 'true' : undefined}
            >
              <FilesList
                files={files}
                onChange={onFilesChange}
                onGripMouseDown={onFileGripMouseDown}
                onDirty={onFilesDirty}
              />
            </li>
          </ul>
        </div>
      </div>

      <div className="editor-controls unselectable">
        <label
          title="Enable this rule (won't be injected if disabled)"
          style={{ display: 'none' }}
        >
          <input
            type="checkbox"
            data-name="cb-editor-enabled"
            tabIndex={-1}
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          Enabled
        </label>
        <label title="Wait for the page to load before injecting this rule">
          <input
            type="checkbox"
            data-name="cb-editor-onload"
            tabIndex={-1}
            checked={onLoad}
            onChange={(e) => onOnLoadChange(e.target.checked)}
          />
          On page load
        </label>
        <label title="Set if this rule can be injected to iframes">
          <input
            type="checkbox"
            data-name="cb-editor-topframeonly"
            tabIndex={-1}
            checked={topFrameOnly}
            onChange={(e) => onTopFrameOnlyChange(e.target.checked)}
          />
          Top frame only
        </label>
        <button
          data-name="btn-editor-cancel"
          className="btn"
          tabIndex={-1}
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          data-name="btn-editor-save"
          className="btn btn-primary"
          tabIndex={-1}
          type="button"
          onClick={onSave}
        >
          Save
        </button>
      </div>

      <i
        className="resize-grip"
        data-name="window-resize-grip"
        onMouseDown={onResizeGripMouseDown}
      />
    </div>
  );
}
