import { test, expect, requiresExtensionPages } from './fixtures.js';
import { makeRule } from './helpers/rules.js';

/** Open the editor for the first rule in the list and wait for Monaco. */
async function openEditor(page) {
  await page.locator('.rule [data-name="btn-rule-action"]').first().click();
  await page.locator('[data-name="btn-rule-edit"]').click();
  await expect(page.locator('#body')).toHaveAttribute('data-editing', 'true');
  await page.locator('#editor-js .monaco-editor').waitFor();
}

test.describe('editor', () => {
  requiresExtensionPages(test);

  test('renders code in a monospaced font with no minimap', async ({
    page,
    openPopup,
    seedRules,
  }) => {
    await seedRules([makeRule({ selector: 'editor-look', js: 'const a = 1;' })]);
    await openPopup(page);
    await openEditor(page);

    const font = await page
      .locator('#editor-js .view-lines')
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).toContain('ui-monospace');
    expect(font).toContain('monospace');

    // Monaco keeps the minimap node and collapses it when disabled.
    const minimapWidth = await page
      .locator('#editor-js .minimap')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(minimapWidth).toBe(0);
  });

  test('suggests classes from the CSS tab inside a class attribute', async ({
    page,
    openPopup,
    seedRules,
  }) => {
    await seedRules([
      makeRule({
        selector: 'editor-intellisense',
        css: '.highlight-box { color: red; }\n@media print { .print-only { display: block; } }\nbody { background: #fff; }',
        html: '',
      }),
    ]);
    await openPopup(page);
    await openEditor(page);

    await page.locator('[data-name="btn-tab"][data-for="html"]').click();
    await page.locator('#editor-html .monaco-editor').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('<div class="');

    const suggestions = page.locator('.suggest-widget .monaco-list-row');
    await expect(
      suggestions.filter({ hasText: 'highlight-box' })
    ).toBeVisible();
    // Selectors nested in at-rules count too.
    await expect(suggestions.filter({ hasText: 'print-only' })).toBeVisible();
    // `#fff` is a declaration value, not an id selector.
    await expect(suggestions.filter({ hasText: 'fff' })).toHaveCount(0);
  });

  test('suggests ids from the CSS tab inside an id attribute', async ({
    page,
    openPopup,
    seedRules,
  }) => {
    await seedRules([
      makeRule({
        selector: 'editor-intellisense-ids',
        css: '#main-title { font-weight: bold; }',
        html: '',
      }),
    ]);
    await openPopup(page);
    await openEditor(page);

    await page.locator('[data-name="btn-tab"][data-for="html"]').click();
    await page.locator('#editor-html .monaco-editor').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('<div id="');

    await expect(
      page.locator('.suggest-widget .monaco-list-row').filter({ hasText: 'main-title' })
    ).toBeVisible();
  });
});
