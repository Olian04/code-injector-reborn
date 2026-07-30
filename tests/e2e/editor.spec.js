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
    // The quote triggers suggestions; asking explicitly removes the race.
    await page.keyboard.press('Control+Space');

    const suggestions = page.locator('.suggest-widget .monaco-list-row');
    await expect(
      suggestions.filter({ hasText: 'highlight-box' })
    ).toBeVisible();
    // Selectors nested in at-rules count too.
    await expect(suggestions.filter({ hasText: 'print-only' })).toBeVisible();
    // `#fff` is a declaration value, not an id selector.
    await expect(suggestions.filter({ hasText: 'fff' })).toHaveCount(0);
  });

  test('explains the URL pattern in a popover', async ({
    page,
    openPopup,
    seedRules,
  }) => {
    await seedRules([makeRule({ selector: 'editor-help', css: 'body{}' })]);
    await openPopup(page);
    await openEditor(page);

    const panel = page.locator('[data-name="po-help-selector"]');
    await expect(panel).toBeHidden();

    await page.locator('[data-name="btn-help-selector"]').click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('regular expression');
    await expect(panel).toContainText('case-sensitive');
    await expect(
      panel.locator('code').filter({ hasText: '^https://example' }).first()
    ).toBeVisible();

    // It has to stay inside the popup window, which is only 500px tall.
    const box = await panel.boundingBox();
    const viewport = page.viewportSize() ?? { width: 500, height: 500 };
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });

  test('explains both injection options in popovers', async ({
    page,
    openPopup,
    seedRules,
  }) => {
    await seedRules([makeRule({ selector: 'editor-help-options', css: 'body{}' })]);
    await openPopup(page);
    await openEditor(page);

    await page.locator('[data-name="btn-help-onpageload"]').click();
    const onLoad = page.locator('[data-name="po-help-onpageload"]');
    await expect(onLoad).toBeVisible();
    await expect(onLoad).toContainText("page's load event");

    await page.locator('[data-name="btn-help-topframeonly"]').click();
    const topFrame = page.locator('[data-name="po-help-topframeonly"]');
    await expect(topFrame).toBeVisible();
    await expect(topFrame).toContainText('iframes');
    // Auto popovers close each other.
    await expect(onLoad).toBeHidden();
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
    await page.keyboard.press('Control+Space');

    await expect(
      page.locator('.suggest-widget .monaco-list-row').filter({ hasText: 'main-title' })
    ).toBeVisible();
  });
});
