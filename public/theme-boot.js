/**
 * Applies a saved light/dark override to <html> before the first paint.
 *
 * Ships as a static file rather than part of a bundle for two reasons: the
 * Manifest V3 CSP forbids inline scripts on extension pages, and the bundles
 * load too late to style the pre-rendered markup. The key must match
 * THEME_CACHE_KEY in src/shared/theme.ts.
 */
(function () {
  try {
    var theme = window.localStorage.getItem('ci-theme');
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.dataset.theme = theme;
    }
  } catch (e) {
    // No storage access: prefers-color-scheme still applies.
  }
})();
