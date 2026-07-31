import { useEffect, useRef, type MouseEvent, type RefObject } from 'react';
import type { EditorTab } from '../types';
import { closeOpenPopovers } from '../dom';
import {
  OnPageLoadHelp,
  SelectorHelp,
  TopFrameOnlyHelp,
} from './EditorHelp';

interface EditorPanelProps {
  active: boolean;
  loading: boolean;
  target: string;
  selector: string;
  selectorActive: boolean;
  selectorError: boolean;
  selectedTab: EditorTab;
  tabFocus: boolean;
  enabled: boolean;
  onLoad: boolean;
  topFrameOnly: boolean;
  codeActive: {
    js: boolean;
    css: boolean;
    html: boolean;
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
  onCancel: () => void;
  onSave: () => void;
  onGetHost: () => void;
  onResizeGripMouseDown: (e: MouseEvent) => void;
}

export function EditorPanel({
  active,
  loading,
  target,
  selector,
  selectorActive,
  selectorError,
  selectedTab,
  tabFocus,
  enabled,
  onLoad,
  topFrameOnly,
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
  onCancel,
  onSave,
  onGetHost,
  onResizeGripMouseDown,
}: EditorPanelProps) {
  const selectorRef = useRef<HTMLInputElement>(null);
  const onLoadRef = useRef<HTMLLabelElement>(null);
  const topFrameOnlyRef = useRef<HTMLLabelElement>(null);

  // The bubbles live in the top layer, so they would outlive a panel dismissed
  // from the keyboard while the pointer still rests on a control.
  useEffect(() => {
    if (!active) closeOpenPopovers();
  }, [active]);

  // Only focus once this panel is on screen, and never let focus scroll the
  // popup: while #editor is translated off-screen, scroll-into-view would shift
  // the whole UI sideways.
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => {
      selectorRef.current?.focus({ preventScroll: true });
    }, 400);
    return () => window.clearTimeout(t);
  }, [active, target]);

  return (
    <div
      id="editor"
      data-target={target}
      data-loading={loading ? 'true' : undefined}
    >
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
                  aria-describedby="help-selector"
                  onChange={(e) => onSelectorChange(e.target.value)}
                />
                <SelectorHelp anchorRef={selectorRef} />
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
        <label ref={onLoadRef} aria-describedby="help-onpageload">
          <input
            type="checkbox"
            data-name="cb-editor-onload"
            tabIndex={-1}
            checked={onLoad}
            onChange={(e) => onOnLoadChange(e.target.checked)}
          />
          On page load
        </label>
        <OnPageLoadHelp anchorRef={onLoadRef} />
        <label ref={topFrameOnlyRef} aria-describedby="help-topframeonly">
          <input
            type="checkbox"
            data-name="cb-editor-topframeonly"
            tabIndex={-1}
            checked={topFrameOnly}
            onChange={(e) => onTopFrameOnlyChange(e.target.checked)}
          />
          Top frame only
        </label>
        <TopFrameOnlyHelp anchorRef={topFrameOnlyRef} />
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
