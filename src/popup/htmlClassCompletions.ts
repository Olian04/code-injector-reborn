import type * as Monaco from 'monaco-editor';

/**
 * Completions for `class=` and `id=` in the HTML tab, sourced from the selectors
 * written in the CSS tab of the same rule.
 *
 * Monaco's HTML service only knows about the document it is given, and the two
 * tabs are separate models, so the class names a rule defines would otherwise
 * never be suggested where they are used.
 */

const NAME = '-?[_a-zA-Z][\\w-]*';
const CLASS_IN_SELECTOR = new RegExp(`\\.(${NAME})`, 'g');
const ID_IN_SELECTOR = new RegExp(`#(${NAME})`, 'g');

/** Cursor sits inside the quoted value of a class/id attribute. */
const IN_CLASS_ATTR = new RegExp(`class\\s*=\\s*["']([^"']*)$`, 'i');
const IN_ID_ATTR = new RegExp(`\\bid\\s*=\\s*["']([^"']*)$`, 'i');

/** How far back to look for the attribute the cursor is inside. */
const LOOKBEHIND = 500;

/**
 * The parts of a stylesheet where selectors can appear: everything outside a
 * declaration block, including the insides of at-rules such as `@media`.
 *
 * Skipping declarations is what keeps `#fff` and `url(#x)` out of the id
 * suggestions.
 */
function selectorRegions(css: string): string[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const regions: string[] = [];
  // One entry per open block, true when it is an at-rule body.
  const blocks: boolean[] = [];
  let buffer = '';

  const inSelectorPosition = () => blocks.every(Boolean);

  for (const char of source) {
    if (char === '{') {
      const prelude = buffer.trim();
      const isAtRule = prelude.startsWith('@');
      if (!isAtRule && inSelectorPosition()) regions.push(prelude);
      blocks.push(isAtRule);
      buffer = '';
    } else if (char === '}') {
      blocks.pop();
      buffer = '';
    } else if (inSelectorPosition()) {
      buffer += char;
    }
  }

  return regions;
}

function uniqueMatches(regions: string[], pattern: RegExp): string[] {
  const found = new Set<string>();
  for (const region of regions) {
    for (const [, name] of region.matchAll(pattern)) found.add(name);
  }
  return [...found].sort();
}

export interface StyleSelectors {
  classes: string[];
  ids: string[];
}

export function parseStyleSelectors(css: string): StyleSelectors {
  const regions = selectorRegions(css);
  return {
    classes: uniqueMatches(regions, CLASS_IN_SELECTOR),
    ids: uniqueMatches(regions, ID_IN_SELECTOR),
  };
}

/**
 * Register against the popup's single CSS model rather than a passed-in editor,
 * so suggestions reflect what is on screen right now, saved or not.
 */
export function registerHtmlClassCompletions(
  monaco: typeof Monaco
): Monaco.IDisposable {
  const readStyles = (): string => {
    const model = monaco.editor
      .getModels()
      .find((m) => m.getLanguageId() === 'css');
    return model?.getValue() ?? '';
  };

  return monaco.languages.registerCompletionItemProvider('html', {
    triggerCharacters: ['"', "'", ' '],
    provideCompletionItems: (model, position) => {
      const prefix = model.getValueInRange({
        startLineNumber: Math.max(1, position.lineNumber - 4),
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const tail = prefix.slice(-LOOKBEHIND);

      const classMatch = IN_CLASS_ATTR.exec(tail);
      const idMatch = classMatch ? null : IN_ID_ATTR.exec(tail);
      if (!classMatch && !idMatch) return { suggestions: [] };

      const { classes, ids } = parseStyleSelectors(readStyles());
      const names = classMatch ? classes : ids;
      if (names.length === 0) return { suggestions: [] };

      // Class attributes hold a list; only the token being typed is replaced.
      const value = (classMatch ?? idMatch)![1];
      const typed = classMatch ? (value.split(/\s+/).pop() ?? '') : value;
      const range = new monaco.Range(
        position.lineNumber,
        position.column - typed.length,
        position.lineNumber,
        position.column
      );

      return {
        suggestions: names.map((name) => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Value,
          detail: classMatch ? 'class from the CSS tab' : 'id from the CSS tab',
          insertText: name,
          range,
        })),
      };
    },
  });
}
