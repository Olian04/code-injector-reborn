/**
 * Build a storage rule in the shape expected by background.serializeRules /
 * the popup UI.
 *
 * @param {object} [options]
 * @param {string} [options.selector]
 * @param {boolean} [options.enabled]
 * @param {boolean} [options.onLoad]
 * @param {boolean} [options.topFrameOnly]
 * @param {string} [options.js] Inline JS (may not execute under Playwright CSP)
 * @param {string} [options.css] Inline CSS
 * @param {string} [options.html] Inline HTML
 */
export function makeRule({
  selector = '127\\.0\\.0\\.1',
  enabled = true,
  onLoad = true,
  topFrameOnly = true,
  js = '',
  css = '',
  html = '',
} = {}) {
  return {
    selector,
    enabled,
    onLoad,
    topFrameOnly,
    code: { js, css, html },
  };
}
