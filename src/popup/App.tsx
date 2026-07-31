import browser from '../shared/browser';
import type BrowserNS from 'webextension-polyfill';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Rule, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { getRules, setRules, getSettings } from '../shared/storage';
import {
  containsCode,
  clearSelection,
  getPathHost,
} from '../shared/utils';
import {
  EDITOR_CONFIG,
  requireMonaco,
  getMonaco,
  monacoTheme,
  applyMonacoTheme,
  type MonacoEditor,
} from './monaco';
import {
  applyTheme,
  isThemePreference,
  resolveTheme,
  watchSystemTheme,
  type ThemePreference,
} from '../shared/theme';
import {
  closeOpenPopovers,
  closest,
  getElementIndex,
  hasOpenPopover,
} from './dom';
import { InfoOverlay } from './components/InfoOverlay';
import { OptionsPanel } from './components/OptionsPanel';
import { RuleItem } from './components/RuleItem';
import { ContextMenu } from './components/ContextMenu';
import { EditorPanel } from './components/EditorPanel';
import {
  DEFAULT_NEW_RULE,
  EMPTY_TAB_DATA,
  type CtxMenuState,
  type EditorState,
  type EditorTab,
  type InjectFeedback,
  type RuleView,
} from './types';
import './styles/browser-action.scss';

/** Stored rules → view models, filling in defaults for older rule records. */
function toRuleViews(
  stored: Rule[],
  counter: { current: number }
): RuleView[] {
  return stored.map((rule) => ({
    ...rule,
    id: counter.current++,
    enabled: rule.enabled === undefined ? true : rule.enabled,
    onLoad: rule.onLoad === undefined ? true : rule.onLoad,
    topFrameOnly: rule.topFrameOnly === undefined ? true : rule.topFrameOnly,
  }));
}

const HIDDEN_CTX: CtxMenuState = {
  visible: false,
  hiding: false,
  x: 0,
  y: 0,
  reversed: false,
  ruleId: null,
  enabled: true,
};

export function App() {
  const manifest = (() => {
    try {
      return chrome.runtime.getManifest();
    } catch {
      return { version: '' };
    }
  })();

  const [rules, setRulesState] = useState<RuleView[]>([]);
  const [rulesLoaded, setRulesLoaded] = useState(false);
  const themeRef = useRef<ThemePreference>('auto');
  const [tabData, setTabData] = useState(EMPTY_TAB_DATA);
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState(false);
  const [options, setOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monacoReady, setMonacoReady] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);

  const [editorTarget, setEditorTarget] = useState('NEW');
  const [selector, setSelector] = useState('');
  const [selectorActive, setSelectorActive] = useState(false);
  const [selectorError, setSelectorError] = useState(false);
  const [selectedTab, setSelectedTab] = useState<EditorTab>('js');
  const [tabFocus, setTabFocus] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [onLoad, setOnLoad] = useState(true);
  const [topFrameOnly, setTopFrameOnly] = useState(true);
  const [codeActive, setCodeActive] = useState({
    js: false,
    css: false,
    html: false,
  });

  const [ctxMenu, setCtxMenu] = useState<CtxMenuState>(HIDDEN_CTX);
  const [injectFeedback, setInjectFeedback] = useState<InjectFeedback>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [resizeLabel, setResizeLabel] = useState({
    w: 540,
    h: 450,
  });

  const rulesCounter = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const rulesListRef = useRef<HTMLUListElement>(null);
  const editorJsRef = useRef<HTMLDivElement>(null);
  const editorCssRef = useRef<HTMLDivElement>(null);
  const editorHtmlRef = useRef<HTMLDivElement>(null);
  const tabContentsRef = useRef<HTMLDivElement>(null);

  const editorJS = useRef<MonacoEditor | null>(null);
  const editorCSS = useRef<MonacoEditor | null>(null);
  const editorHTML = useRef<MonacoEditor | null>(null);

  // Monaco is loaded on demand, so code can be set before the editors exist.
  // Buffer it here and flush once they are created.
  const pendingCode = useRef<Record<'js' | 'css' | 'html', string> | null>(null);
  const editorsPromise = useRef<Promise<void> | null>(null);
  const disposed = useRef(false);

  const isDragging = useRef(false);
  const unsavedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editingRef = useRef(editing);
  const optionsRef = useRef(options);
  const tabDataRef = useRef(tabData);
  const editorMetaRef = useRef({
    target: editorTarget,
    enabled,
    onLoad,
    topFrameOnly,
    selector,
  });

  editingRef.current = editing;
  optionsRef.current = options;
  tabDataRef.current = tabData;
  editorMetaRef.current = {
    target: editorTarget,
    enabled,
    onLoad,
    topFrameOnly,
    selector,
  };

  const setBodySize = useCallback((width: number, height: number) => {
    document.body.style.width = `${width}px`;
    document.body.style.height = `${height}px`;
    if (tabContentsRef.current) {
      tabContentsRef.current.style.height = `${height - 130}px`;
    }
    editorJS.current?.layout();
    editorCSS.current?.layout();
    editorHTML.current?.layout();
  }, []);

  const persistRules = useCallback(async (next: RuleView[]) => {
    setSaving(true);
    const payload: Rule[] = next.map(
      ({ selector, enabled, onLoad, topFrameOnly, code }) => ({
        selector,
        enabled,
        onLoad,
        topFrameOnly,
        code,
      })
    );
    await setRules(payload);
    setSaving(false);
  }, []);

  /** Code from the live editors, or the buffer while Monaco is still loading. */
  const readCode = useCallback((): Record<'js' | 'css' | 'html', string> => {
    const pending = pendingCode.current;
    return {
      js: editorJS.current?.getValue() ?? pending?.js ?? '',
      css: editorCSS.current?.getValue() ?? pending?.css ?? '',
      html: editorHTML.current?.getValue() ?? pending?.html ?? '',
    };
  }, []);

  const getEditorPanelData = useCallback((): EditorState => {
    const meta = editorMetaRef.current;
    const code = readCode();
    const data: EditorState = {
      target: meta.target,
      enabled: meta.enabled,
      onLoad: meta.onLoad,
      topFrameOnly: meta.topFrameOnly,
      selector: meta.selector.trim(),
      code,
    };

    try {
      // Validate regex; invalid patterns become empty (blocked on save)
      void new RegExp(data.selector).test(tabDataRef.current.topURL);
    } catch {
      data.selector = '';
    }

    return data;
  }, [readCode]);

  const checkEditorDots = useCallback(() => {
    if (dotsTimeout.current) clearTimeout(dotsTimeout.current);
    dotsTimeout.current = setTimeout(() => {
      const code = readCode();
      setCodeActive({
        js: containsCode(code.js),
        css: containsCode(code.css),
        html: containsCode(code.html),
      });
    }, 1000);
  }, [readCode]);

  const setLastSession = useCallback(() => {
    checkEditorDots();
    if (unsavedTimeout.current) clearTimeout(unsavedTimeout.current);
    if (!editingRef.current) return;

    unsavedTimeout.current = setTimeout(() => {
      if (editingRef.current && !isDragging.current) {
        void browser.storage.local.set({
          lastSession: getEditorPanelData(),
        });
      }
    }, 750);
  }, [checkEditorDots, getEditorPanelData]);

  const applyEditorState = useCallback(
    (data: Partial<EditorState> & { code?: EditorState['code'] }) => {
      const next: EditorState = {
        target: data.target ?? 'NEW',
        onLoad: data.onLoad ?? false,
        enabled: data.enabled ?? false,
        selector: data.selector ?? '',
        topFrameOnly: data.topFrameOnly ?? false,
        code: {
          js: data.code?.js ?? '',
          css: data.code?.css ?? '',
          html: data.code?.html ?? '',
        },
      };

      const active = {
        js: containsCode(next.code.js),
        css: containsCode(next.code.css),
        html: containsCode(next.code.html),
      };

      let activeTab: EditorTab = 'js';
      if (active.js) activeTab = 'js';
      else if (active.css) activeTab = 'css';
      else if (active.html) activeTab = 'html';

      if (editorJS.current && editorCSS.current && editorHTML.current) {
        editorJS.current.setValue(next.code.js);
        editorCSS.current.setValue(next.code.css);
        editorHTML.current.setValue(next.code.html);
        pendingCode.current = null;
      } else {
        pendingCode.current = {
          js: next.code.js,
          css: next.code.css,
          html: next.code.html,
        };
      }

      setCodeActive(active);
      setSelectedTab(activeTab);
      setSelector(next.selector.trim());
      try {
        setSelectorActive(
          next.selector.trim()
            ? new RegExp(next.selector.trim()).test(tabDataRef.current.topURL)
            : false
        );
      } catch {
        setSelectorActive(false);
      }
      setSelectorError(false);
      setEditorTarget(next.target);
      setEnabled(next.enabled);
      setOnLoad(next.onLoad);
      setTopFrameOnly(next.topFrameOnly);
    },
    []
  );

  /**
   * Load Monaco and create the three editors, at most once. Called from idle
   * time after the rules list paints, and awaited if the user opens the editor
   * before that finishes.
   */
  const ensureEditors = useCallback((): Promise<void> => {
    if (editorsPromise.current) return editorsPromise.current;

    setEditorLoading(true);

    editorsPromise.current = requireMonaco()
      .then(() => {
        if (disposed.current) return;

        const jsHost = editorJsRef.current;
        const cssHost = editorCssRef.current;
        const htmlHost = editorHtmlRef.current;
        if (!jsHost || !cssHost || !htmlHost) {
          // Containers are missing; let a later call retry.
          editorsPromise.current = null;
          return;
        }

        const m = getMonaco();
        const theme = monacoTheme(resolveTheme(themeRef.current));
        const js = m.editor.create(jsHost, {
          ...EDITOR_CONFIG,
          theme,
          language: 'javascript',
        });
        const css = m.editor.create(cssHost, {
          ...EDITOR_CONFIG,
          theme,
          language: 'css',
        });
        const html = m.editor.create(htmlHost, {
          ...EDITOR_CONFIG,
          theme,
          language: 'html',
        });

        editorJS.current = js;
        editorCSS.current = css;
        editorHTML.current = html;

        const onFocus = () => setTabFocus(true);
        const onBlur = () => setTabFocus(false);

        for (const editor of [js, css, html]) {
          editor.onDidFocusEditorWidget(onFocus);
          editor.onDidBlurEditorWidget(onBlur);
          editor.onDidChangeModelContent(() => setLastSession());
        }

        for (const id of ['#editor-js', '#editor-css', '#editor-html']) {
          const area = document.querySelector(
            `${id} .inputarea`
          ) as HTMLElement | null;
          if (area) area.dataset.name = 'txt-editor-inputarea';
        }

        const pending = pendingCode.current;
        if (pending) {
          js.setValue(pending.js);
          css.setValue(pending.css);
          html.setValue(pending.html);
          pendingCode.current = null;
        }

        js.layout();
        css.layout();
        html.layout();

        setMonacoReady(true);
      })
      .catch((err: unknown) => {
        console.error('[Code Injector Reborn] Monaco failed to load', err);
        editorsPromise.current = null;
      })
      .finally(() => {
        if (!disposed.current) setEditorLoading(false);
      });

    return editorsPromise.current;
  }, [setLastSession]);

  const hideRuleContextMenu = useCallback(() => {
    setCtxMenu((prev) => {
      if (prev.hiding) return prev;
      if (!prev.visible) return prev;
      return { ...prev, hiding: true };
    });
    setTimeout(() => {
      setCtxMenu(HIDDEN_CTX);
      setInjectFeedback(null);
    }, 200);
  }, []);

  const showRuleContextMenu = useCallback(
    (ruleId: number, x: number, y: number) => {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) return;

      const reversed = window.innerHeight - y < 248;
      setInjectFeedback(null);
      setCtxMenu({
        visible: true,
        hiding: false,
        x,
        y,
        reversed,
        ruleId,
        enabled: rule.enabled,
      });
    },
    [rules]
  );

  // First paint: size the popup and show the rules list. Monaco is deliberately
  // not on this path — it is ~4 MB and used to delay the popup by ~1s.
  useEffect(() => {
    disposed.current = false;

    void getSettings().then((settings: Settings) => {
      if (settings.size) {
        setBodySize(settings.size.width, settings.size.height);
      }
      themeRef.current = settings.theme;
      applyTheme(settings.theme);
      applyMonacoTheme(resolveTheme(settings.theme));
    });

    // Embedded options persist theme via storage; keep Monaco / themeRef in sync
    // without letting the options tree call applyTheme itself.
    const onSettingsChanged = (changes: {
      settings?: { newValue?: Settings };
    }) => {
      const next = changes.settings?.newValue;
      if (!next || !isThemePreference(next.theme)) return;
      themeRef.current = next.theme;
      applyTheme(next.theme);
      applyMonacoTheme(resolveTheme(next.theme));
      if (next.size) {
        setBodySize(next.size.width, next.size.height);
      }
    };
    browser.storage.onChanged.addListener(onSettingsChanged);

    // Only relevant while following the OS; CSS handles the page, Monaco
    // needs telling.
    const unwatch = watchSystemTheme((scheme) => {
      if (themeRef.current === 'auto') applyMonacoTheme(scheme);
    });

    // Read rules straight from storage rather than waiting for the service
    // worker round-trip below; tab data only drives the "matches" highlight.
    void getRules()
      .then((stored) => {
        if (disposed.current) return;
        setRulesState(toRuleViews(stored, rulesCounter));
      })
      .finally(() => {
        if (!disposed.current) setRulesLoaded(true);
        delete document.body.dataset.loading;
      });

    void browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs: { id?: number }[]) => {
        if (tabs[0]?.id != null) {
          void browser.runtime.sendMessage({
            action: 'get-current-tab-data',
            tabId: tabs[0].id,
          });
        }
      });

    // Warm the editor once the list is interactive, so opening a rule is
    // instant in the common case without holding up the popup.
    const warm = () => {
      if (!disposed.current) void ensureEditors();
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(warm, { timeout: 1000 })
      : window.setTimeout(warm, 200);

    return () => {
      disposed.current = true;
      unwatch();
      browser.storage.onChanged.removeListener(onSettingsChanged);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      editorJS.current?.dispose();
      editorCSS.current?.dispose();
      editorHTML.current?.dispose();
    };
  }, [ensureEditors, setBodySize]);

  // The panels are positioned with transforms, so #body must never scroll:
  // focusing anything in an off-screen panel would drag the popup sideways.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const reset = () => {
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
      if (el.scrollTop !== 0) el.scrollTop = 0;
    };
    el.addEventListener('scroll', reset);
    return () => el.removeEventListener('scroll', reset);
  }, []);

  // Relayout Monaco after the editor panel finishes sliding in.
  useEffect(() => {
    if (!editing || !monacoReady) return;
    const timer = window.setTimeout(() => {
      editorJS.current?.layout();
      editorCSS.current?.layout();
      editorHTML.current?.layout();
    }, 420);
    return () => window.clearTimeout(timer);
  }, [editing, monacoReady]);

  // Message listener
  useEffect(() => {
    const handleMessage = (
      message: unknown,
      _sender: BrowserNS.Runtime.MessageSender,
      callback?: (response?: unknown) => void
    ) => {
      const mex = message as {
        action?: string;
        success?: boolean;
        data?: { topURL?: string; innerURLs?: string[] };
      };
      const cb = typeof callback === 'function' ? callback : () => {};

      switch (mex.action) {
        case 'inject':
          setInjectFeedback(mex.success ? 'success' : 'fail');
          break;

        case 'get-current-tab-data': {
          setTabData({
            topURL: mex.data?.topURL ?? '',
            innerURLs: mex.data?.innerURLs ?? [],
          });
          break;
        }
      }

      cb();
      return true;
    };

    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      switch (e.keyCode) {
        case 9: {
          // TAB
          if (editingRef.current) {
            const name = target.dataset.name;
            if (name === 'txt-editor-selector') {
              switch (selectedTab) {
                case 'js':
                  editorJS.current
                    ?.getDomNode()
                    ?.querySelector<HTMLTextAreaElement>('textarea.inputarea')
                    ?.focus();
                  break;
                case 'css':
                  editorCSS.current
                    ?.getDomNode()
                    ?.querySelector<HTMLTextAreaElement>('textarea.inputarea')
                    ?.focus();
                  break;
                case 'html':
                  editorHTML.current
                    ?.getDomNode()
                    ?.querySelector<HTMLTextAreaElement>('textarea.inputarea')
                    ?.focus();
                  break;
                case 'settings':
                  document
                    .querySelector<HTMLSelectElement>(
                      '[data-name="sel-editor-enabled"]'
                    )
                    ?.focus();
                  break;
              }
            }
          }
          e.preventDefault();
          e.stopPropagation();
          break;
        }
        case 83: {
          if (editingRef.current && (e.ctrlKey || e.metaKey)) {
            (
              document.querySelector(
                '[data-name="btn-editor-save"]'
              ) as HTMLButtonElement | null
            )?.click();
            e.preventDefault();
            e.stopPropagation();
          }
          break;
        }
        case 27: {
          // Escape dismisses a help bubble first, and only that: the bubbles
          // are manual popovers, so nothing else will close them.
          if (hasOpenPopover()) {
            closeOpenPopovers();
            e.preventDefault();
            e.stopPropagation();
            break;
          }
          if (optionsRef.current) {
            setOptions(false);
            e.preventDefault();
            e.stopPropagation();
            break;
          }
          if (e.shiftKey) setEditing(false);
          setInfo(false);
          e.preventDefault();
          e.stopPropagation();
          break;
        }
      }

      if (editingRef.current) setLastSession();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedTab, setLastSession]);

  const handleSelectorChange = (value: string) => {
    setSelector(value);
    setSelectorError(false);
    try {
      setSelectorActive(
        value.trim()
          ? new RegExp(value.trim()).test(tabData.topURL)
          : false
      );
    } catch {
      setSelectorActive(false);
      setSelectorError(true);
    }
    setLastSession();
  };

  const handleAddRule = () => {
    applyEditorState(DEFAULT_NEW_RULE);
    void ensureEditors();
    setOptions(false);
    setInfo(false);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    void browser.storage.local.remove('lastSession');
  };

  const handleSave = () => {
    const editorData = getEditorPanelData();
    if (!editorData.selector) {
      setSelectorError(true);
      return;
    }

    const isNew = editorData.target === 'NEW';
    const view: RuleView = {
      id: isNew ? rulesCounter.current++ : Number(editorData.target),
      enabled: editorData.enabled,
      onLoad: editorData.onLoad,
      topFrameOnly: editorData.topFrameOnly,
      selector: editorData.selector,
      code: editorData.code,
    };

    setRulesState((prev) => {
      let next: RuleView[];
      if (isNew) {
        next = [...prev, view];
      } else {
        next = prev.map((r) => (r.id === view.id ? view : r));
      }
      void persistRules(next);
      return next;
    });

    setEditing(false);
    void browser.storage.local.remove('lastSession');
  };

  const handleGetHost = () => {
    const host = getPathHost(tabData.topURL).replace(/\./g, '\\.');
    setSelector(host);
    setSelectorActive(true);
    setSelectorError(false);
    setLastSession();
  };

  const findCtxRule = () =>
    rules.find((r) => r.id === ctxMenu.ruleId) ?? null;

  const handleEdit = () => {
    const rule = findCtxRule();
    if (!rule) return;
    applyEditorState({
      target: String(rule.id),
      enabled: rule.enabled,
      onLoad: rule.onLoad,
      topFrameOnly: rule.topFrameOnly,
      selector: rule.selector,
      code: rule.code,
    });
    void ensureEditors();
    hideRuleContextMenu();
    setOptions(false);
    setInfo(false);
    setEditing(true);
  };

  const handleInject = () => {
    const rule = findCtxRule();
    if (!rule) return;
    void browser.runtime.sendMessage({
      action: 'inject',
      rule: {
        enabled: rule.enabled,
        onLoad: rule.onLoad,
        topFrameOnly: rule.topFrameOnly,
        selector: rule.selector,
        code: rule.code,
      },
    });
  };

  const handleMoveTop = () => {
    const id = ctxMenu.ruleId;
    if (id == null) return;
    setRulesState((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      void persistRules(next);
      return next;
    });
    rulesListRef.current?.scroll({ top: 0, left: 0, behavior: 'smooth' });
    hideRuleContextMenu();
  };

  const handleMoveBottom = () => {
    const id = ctxMenu.ruleId;
    if (id == null) return;
    setRulesState((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      void persistRules(next);
      return next;
    });
    const list = rulesListRef.current;
    list?.scroll({ top: list.scrollHeight, left: 0, behavior: 'smooth' });
    hideRuleContextMenu();
  };

  const handleToggleEnabled = () => {
    const id = ctxMenu.ruleId;
    if (id == null) return;
    setRulesState((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      void persistRules(next);
      const updated = next.find((r) => r.id === id);
      if (updated) {
        setCtxMenu((c) => ({ ...c, enabled: updated.enabled }));
      }
      return next;
    });
  };

  const handleDelete = (confirm: boolean) => {
    if (!confirm) return;
    const id = ctxMenu.ruleId;
    if (id == null) return;
    setRemovingId(id);
    hideRuleContextMenu();
    setTimeout(() => {
      setRulesState((prev) => {
        const next = prev.filter((r) => r.id !== id);
        void persistRules(next);
        return next;
      });
      setRemovingId(null);
    }, 200);
  };

  const startDragReorder = (
    e: React.MouseEvent,
    listEl: HTMLElement | null
  ) => {
    if (!listEl) return;
    const target = e.target as HTMLElement;
    const item = closest(target, 'li') as HTMLElement | null;
    if (!item || item.parentElement !== listEl) return;

    isDragging.current = true;
    clearSelection();

    const ghost = document.createElement('li');
    ghost.className = 'ghost';

    const parent = item.parentElement!;
    const ruleIndex = getElementIndex(item);
    const Y = e.screenY;

    const evMM = (ev: MouseEvent) => {
      item.style.transform = `translateY(${ev.screenY - Y}px)`;
      const targetEl = closest(ev.target as Element, (el) =>
        el.parentElement === parent
      ) as HTMLElement | null;
      if (!targetEl || targetEl === ghost) return;

      const ghostIndex = getElementIndex(ghost);
      const targetRuleIndex = getElementIndex(targetEl);

      if (targetRuleIndex < ghostIndex) {
        targetEl.parentElement!.insertBefore(ghost, targetEl);
      } else {
        targetEl.parentElement!.insertBefore(
          ghost,
          targetEl.nextElementSibling
        );
      }

      if (targetRuleIndex > ruleIndex) {
        item.style.marginTop = '0px';
      } else {
        item.style.marginTop = '';
      }
    };

    const evMU = () => {
      delete item.dataset.dragging;
      item.style.cssText = '';

      ghost.parentElement?.insertBefore(item, ghost);
      ghost.remove();
      delete parent.dataset.dragging;

      window.removeEventListener('mousemove', evMM);
      window.removeEventListener('mouseup', evMU);

      if (item.classList.contains('rule')) {
        // Rebuild order from DOM
        const ids = Array.from(parent.children)
          .filter((el) => el.classList.contains('rule'))
          .map((el) => Number((el as HTMLElement).dataset.id));
        setRulesState((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]));
          const next = ids
            .map((id) => map.get(id))
            .filter((r): r is RuleView => !!r);
          void persistRules(next);
          return next;
        });
      }

      isDragging.current = false;
      clearSelection();
      if (editingRef.current) setLastSession();
    };

    item.dataset.dragging = 'true';
    parent.insertBefore(ghost, item);
    parent.dataset.dragging = 'true';

    window.addEventListener('mousemove', evMM);
    window.addEventListener('mouseup', evMU);
  };

  const handleResizeGrip = (e: React.MouseEvent) => {
    const prevData = {
      x: e.screenX,
      y: e.screenY,
      w: window.innerWidth,
      h: window.innerHeight,
    };
    setResizeLabel({ w: window.innerWidth, h: window.innerHeight });

    const evMM = (ev: MouseEvent) => {
      document.body.style.width = `${prevData.w + (prevData.x - ev.screenX)}px`;
      document.body.style.height = `${prevData.h + (ev.screenY - prevData.y)}px`;
      setResizeLabel({ w: window.innerWidth, h: window.innerHeight });
    };

    const evMU = () => {
      if (tabContentsRef.current) {
        tabContentsRef.current.style.height = `${window.innerHeight - 130}px`;
      }
      delete document.body.dataset.resizing;
      editorJS.current?.layout();
      editorCSS.current?.layout();
      editorHTML.current?.layout();

      void browser.storage.local.get('settings').then((data: { settings?: Settings }) => {
        const settings: Settings = { ...DEFAULT_SETTINGS, ...data.settings };
        settings.size = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
        void browser.storage.local.set({ settings });
      });

      window.removeEventListener('mousemove', evMM);
      window.removeEventListener('mouseup', evMU);
    };

    document.body.dataset.resizing = 'true';
    window.addEventListener('mousemove', evMM);
    window.addEventListener('mouseup', evMU);
  };

  const actionVisible = ctxMenu.visible || ctxMenu.hiding;

  return (
    <div
      id="body"
      ref={bodyRef}
      data-editing={editing ? 'true' : undefined}
      data-info={info ? 'true' : undefined}
      data-options={options ? 'true' : undefined}
      data-saving={saving ? 'true' : undefined}
    >
      <input className="txt-hidden" type="text" readOnly tabIndex={-1} />

      <InfoOverlay
        version={manifest.version || ''}
        onHide={() => setInfo(false)}
      />

      <OptionsPanel active={options} onHide={() => setOptions(false)} />

      <div id="rules" className="unselectable">
        <ContextMenu
          state={ctxMenu}
          injectFeedback={injectFeedback}
          onBackgroundClick={hideRuleContextMenu}
          onEdit={handleEdit}
          onInject={handleInject}
          onMoveTop={handleMoveTop}
          onMoveBottom={handleMoveBottom}
          onToggleEnabled={handleToggleEnabled}
          onDelete={handleDelete}
          onInjectMouseLeave={() => setInjectFeedback(null)}
        />

        <ul
          className="rules-list"
          ref={rulesListRef}
          data-actionvisible={actionVisible ? 'true' : undefined}
        >
          {!rulesLoaded && <li className="rule rule-placeholder" />}
          {rules.map((rule) => (
            <RuleItem
              key={rule.id}
              rule={rule}
              tabData={tabData}
              actionVisible={ctxMenu.ruleId === rule.id && actionVisible}
              removing={removingId === rule.id}
              onActionClick={(e, ruleId) => {
                e.stopPropagation();
                showRuleContextMenu(ruleId, e.pageX, e.pageY);
              }}
              onGripMouseDown={(e) =>
                startDragReorder(e, rulesListRef.current)
              }
            />
          ))}
        </ul>

        <div className="rules-controls">
          <button
            className="btn btn-left btn-icon material-icons"
            data-name="btn-info-show"
            title="Info"
            tabIndex={-1}
            type="button"
            onClick={() => {
              setOptions(false);
              setInfo(true);
            }}
          >
            &#xE88F;
          </button>
          <button
            className="btn btn-left"
            data-name="btn-general-options-show"
            tabIndex={-1}
            type="button"
            onClick={() => {
              setEditing(false);
              setInfo(false);
              setOptions(true);
            }}
          >
            Options
          </button>
          <button
            className="btn btn-primary"
            data-name="btn-rules-add"
            tabIndex={-1}
            type="button"
            onClick={handleAddRule}
          >
            Add rule
          </button>
        </div>
      </div>

      <EditorPanel
        active={editing}
        loading={editorLoading}
        target={editorTarget}
        selector={selector}
        selectorActive={selectorActive}
        selectorError={selectorError}
        selectedTab={selectedTab}
        tabFocus={tabFocus}
        enabled={enabled}
        onLoad={onLoad}
        topFrameOnly={topFrameOnly}
        codeActive={codeActive}
        editorJsRef={editorJsRef}
        editorCssRef={editorCssRef}
        editorHtmlRef={editorHtmlRef}
        tabContentsRef={tabContentsRef}
        onSelectorChange={handleSelectorChange}
        onTabSelect={setSelectedTab}
        onEnabledChange={(v) => {
          setEnabled(v);
          setLastSession();
        }}
        onOnLoadChange={(v) => {
          setOnLoad(v);
          setLastSession();
        }}
        onTopFrameOnlyChange={(v) => {
          setTopFrameOnly(v);
          setLastSession();
        }}
        onCancel={handleCancel}
        onSave={handleSave}
        onGetHost={handleGetHost}
        onResizeGripMouseDown={handleResizeGrip}
      />

      <div id="resize" className="unselectable">
        <div className="r-size">
          <div className="r-size-width">{resizeLabel.w}</div>x
          <div className="r-size-height">{resizeLabel.h}</div>
        </div>
        <i className="resize-grip" />
      </div>
    </div>
  );
}
