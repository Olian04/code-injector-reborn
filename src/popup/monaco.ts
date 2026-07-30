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

/** Load Monaco via the AMD loader (same approach as the legacy popup). */
export function requireMonaco(): Promise<void> {
  return new Promise((resolve) => {
    // Manifest V3 CSP forbids blob: workers; use vendored workers on the
    // extension origin. JS/TS, CSS, and HTML language services are packaged;
    // unused services (e.g. JSON) are not.
    (self as typeof self & {
      MonacoEnvironment?: {
        getWorkerUrl: (_moduleId: string, label: string) => string;
      };
    }).MonacoEnvironment = {
      getWorkerUrl(_moduleId, label) {
        if (label === 'json') {
          return '/monaco/vs/base/worker/workerMain.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return '/monaco/vs/language/css/cssWorker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return '/monaco/vs/language/html/htmlWorker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return '/monaco/vs/language/typescript/tsWorker.js';
        }
        return '/monaco/vs/base/worker/workerMain.js';
      },
    };

    const amdRequire = (
      globalThis as typeof globalThis & { require: AmdRequire }
    ).require;

    amdRequire.config({ paths: { vs: '/monaco/vs' } });
    amdRequire(['vs/editor/editor.main'], () => {
      configureMonacoLanguageServices();
      resolve();
    });
  });
}

export function getMonaco(): typeof Monaco {
  return (globalThis as typeof globalThis & { monaco: typeof Monaco }).monaco;
}
