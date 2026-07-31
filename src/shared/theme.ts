export type ThemePreference = 'auto' | 'light' | 'dark';

/**
 * Mirror of the stored preference, kept in localStorage because it can be read
 * synchronously: the theme boot script applies it before the first paint, while
 * `chrome.storage` is only readable asynchronously.
 */
export const THEME_CACHE_KEY = 'ci-theme';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'auto' || value === 'light' || value === 'dark';
}

/** Turn the preference into the scheme currently on screen. */
export function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme !== 'auto') return theme;
  return prefersDark() ? 'dark' : 'light';
}

export function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * `data-theme` is only set for explicit overrides; leaving it off lets the
 * stylesheet's `prefers-color-scheme` query drive the automatic case.
 */
export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === 'auto') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }

  try {
    window.localStorage.setItem(THEME_CACHE_KEY, theme);
  } catch {
    // Private windows can refuse storage; the theme still applies for this page.
  }
}

/** Run `listener` whenever the OS scheme changes while following it. */
export function watchSystemTheme(listener: (scheme: 'light' | 'dark') => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (event: MediaQueryListEvent) => {
    listener(event.matches ? 'dark' : 'light');
  };
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}
