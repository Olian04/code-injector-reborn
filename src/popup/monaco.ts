import type * as Monaco from 'monaco-editor';

export type MonacoEditor = Monaco.editor.IStandaloneCodeEditor;

export const EDITOR_CONFIG: Monaco.editor.IStandaloneEditorConstructionOptions = {
  cursorBlinking: 'phase',
  fontSize: 11,
  folding: true,
  guides: { indentation: true },
  renderLineHighlight: 'none',
  scrollbar: {
    verticalScrollbarSize: 0,
  },
  minimap: {
    enabled: true,
    renderCharacters: false,
    showSlider: 'always',
  },
};

interface AmdRequire {
  (modules: string[], callback: () => void): void;
  config: (cfg: { paths: Record<string, string> }) => void;
}

/**
 * Ambient modules so `import … from 'https://…'` type-checks in the editor.
 * Scripts are not bundled; the realistic module form is ESM loaded from a URL.
 */
const URL_ESM_TYPES = `
declare module 'http://*' {
  const mod: unknown;
  export default mod;
  export = mod;
}
declare module 'https://*' {
  const mod: unknown;
  export default mod;
  export = mod;
}
`.trim();

/**
 * Enable DOM/ES typings + semantic checking for the JS editor.
 *
 * Injected scripts run in the page context (no compile step), so authors need
 * Window/Document libs and ESM-from-URL imports — not Node resolution.
 * Monaco 0.52 only exposes Classic | NodeJs; Classic matches browser URL ESM.
 */
export function configureMonacoLanguageServices(): void {
  const monaco = getMonaco();
  const { typescript } = monaco.languages;

  const compilerOptions: Monaco.languages.typescript.CompilerOptions = {
    target: typescript.ScriptTarget.ESNext,
    module: typescript.ModuleKind.ESNext,
    // Not Node: no node_modules lookup. Pair with URL ambient modules below.
    moduleResolution: typescript.ModuleResolutionKind.Classic,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    // Embedded in tsWorker (lib.dom.d.ts, lib.esnext*.d.ts, …).
    lib: ['esnext', 'dom', 'dom.iterable'],
  };

  typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
  typescript.typescriptDefaults.setCompilerOptions({
    ...compilerOptions,
    allowJs: false,
    checkJs: false,
  });

  typescript.javascriptDefaults.addExtraLib(
    URL_ESM_TYPES,
    'ts:code-injector-url-esm.d.ts'
  );
  typescript.typescriptDefaults.addExtraLib(
    URL_ESM_TYPES,
    'ts:code-injector-url-esm.d.ts'
  );

  // Monaco defaults JS to noSemanticValidation: true — turn it on so lib
  // completions / type errors show while authoring injection scripts.
  const diagnostics: Monaco.languages.typescript.DiagnosticsOptions = {
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: false,
  };
  typescript.javascriptDefaults.setDiagnosticsOptions(diagnostics);
  typescript.typescriptDefaults.setDiagnosticsOptions(diagnostics);

  // Eager model sync keeps worker libs in sync when switching editor tabs.
  typescript.javascriptDefaults.setEagerModelSync(true);
  typescript.typescriptDefaults.setEagerModelSync(true);
}

const LOADER_SRC = '/monaco/vs/loader.js';

let loaderPromise: Promise<void> | null = null;
let monacoPromise: Promise<void> | null = null;

/**
 * Fetch the AMD loader on demand. Keeping it out of the popup document means
 * opening the action does not pay for Monaco before the rules list can paint.
 */
function loadAmdLoader(): Promise<void> {
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    if ((globalThis as typeof globalThis & { require?: AmdRequire }).require) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = LOADER_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${LOADER_SRC}`));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

/** Load Monaco via the AMD loader (same approach as the legacy popup). */
export function requireMonaco(): Promise<void> {
  if (monacoPromise) return monacoPromise;

  monacoPromise = loadAmdLoader()
    .then(
      () =>
        new Promise<void>((resolve) => {
          // Every language service boots from the AMD worker host, which pulls
          // in the requested module itself. Pointing at the language modules
          // directly hands `define()` to a plain worker, which throws and makes
          // Monaco fall back to running the services on the main thread.
          // Manifest V3 CSP forbids blob: workers, and this URL is same-origin,
          // so Monaco uses it as-is.
          (self as typeof self & {
            MonacoEnvironment?: { getWorkerUrl: () => string };
          }).MonacoEnvironment = {
            getWorkerUrl: () => '/monaco/vs/base/worker/workerMain.js',
          };

          const amdRequire = (
            globalThis as typeof globalThis & { require: AmdRequire }
          ).require;

          amdRequire.config({ paths: { vs: '/monaco/vs' } });
          amdRequire(['vs/editor/editor.main'], () => {
            configureMonacoLanguageServices();
            resolve();
          });
        })
    )
    .catch((err: unknown) => {
      // Let a later attempt retry instead of caching the failure forever.
      loaderPromise = null;
      monacoPromise = null;
      throw err;
    });

  return monacoPromise;
}

export function getMonaco(): typeof Monaco {
  return (globalThis as typeof globalThis & { monaco: typeof Monaco }).monaco;
}

/** Built-in Monaco theme matching the extension's current colour scheme. */
export function monacoTheme(scheme: 'light' | 'dark'): string {
  return scheme === 'dark' ? 'vs-dark' : 'vs';
}

/** No-op until Monaco is loaded; editors pick the theme up at creation. */
export function applyMonacoTheme(scheme: 'light' | 'dark'): void {
  const monaco = (globalThis as typeof globalThis & { monaco?: typeof Monaco })
    .monaco;
  monaco?.editor.setTheme(monacoTheme(scheme));
}
