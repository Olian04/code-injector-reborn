/**
 * Shared Playwright expects for injection side-effects on the fixture page.
 */

export async function expectNoInjection(page, expect) {
  await expect(page.locator('html')).not.toHaveAttribute('data-ci-injected', '1');
  await expect(page.locator('#ci-html-marker')).toHaveCount(0);
  await expect(page.locator('#ci-inline-html')).toHaveCount(0);
  await expect(page).toHaveTitle('Code Injector Fixture');
  // The fixture page ships no scripts of its own, so any is one we injected.
  await expect(page.locator('head script')).toHaveCount(0);
}

/** Side effects of tests/fixtures/marker.js having executed in the page. */
export async function expectMarkerModuleRan(page, expect) {
  await expect
    .poll(async () => page.locator('html').getAttribute('data-ci-injected'), {
      timeout: 15_000,
    })
    .toBe('1');
  await expect(page).toHaveTitle('CI_INJECTED');
}

export async function expectInlineCssInjected(page, expect, rgb = 'rgb(1, 2, 3)') {
  await expect
    .poll(async () => {
      return page.locator('html').evaluate((el) => getComputedStyle(el).backgroundColor);
    })
    .toBe(rgb);
}

export async function expectInlineHtmlInjected(page, expect, id = 'ci-inline-html') {
  await expect(page.locator(`#${id}`)).toBeVisible({ timeout: 15_000 });
}

/**
 * Chromium applies the extension's own MV3 policy to DOM work done from a
 * content script's isolated world, so a `<script>` the injector appends there
 * never runs however permissive the page is. Firefox uses the page's policy and
 * runs it. Assert on the node itself where the engines disagree.
 */
export async function expectInlineJsScriptPresent(page, expect, snippet) {
  await expect
    .poll(async () => {
      return page.evaluate((text) => {
        return [...document.head.querySelectorAll('script')].some(
          (el) => !el.src && el.textContent.includes(text)
        );
      }, snippet);
    })
    .toBe(true);
}
