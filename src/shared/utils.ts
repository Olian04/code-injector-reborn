/** Strip comments and check whether a string still contains code. */
export function containsCode(value: string | undefined | null): boolean {
  if (!value) return false;
  return !!value
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*|<!--[\s\S]*?-->$/gm, '')
    .trim();
}

export function parseURL(path: string): URL | null {
  try {
    return new URL(path);
  } catch {
    return null;
  }
}

export function stripHTMLFromString(value: string): string {
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return doc.body.textContent || '';
}

export function getPathHost(path: string): string {
  try {
    return new URL(path).hostname;
  } catch {
    return path;
  }
}

export function downloadText(
  fileName: string,
  textContent: string
): boolean {
  if (typeof document === 'undefined') return false;

  const a = document.createElement('a');
  a.setAttribute('download', fileName || 'codeInjector');
  a.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent || '')
  );
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

export function clearSelection(): void {
  if (window.getSelection) {
    window.getSelection()?.removeAllRanges();
  }
}
