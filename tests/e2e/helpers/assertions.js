/**
 * Shared Playwright expects for injection side-effects on the fixture page.
 */

export async function expectNoInjection(page, expect) {
  await expect(page.locator('html')).not.toHaveAttribute('data-ci-injected', '1');
  await expect(page.locator('#ci-html-marker')).toHaveCount(0);
  await expect(page.locator('#ci-inline-html')).toHaveCount(0);
  await expect(page).toHaveTitle('Code Injector Fixture');
}

export async function expectRemoteJsInjected(page, expect) {
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

export async function expectRemoteCssInjected(page, expect) {
  await expect
    .poll(async () => {
      return page.locator('html').evaluate((el) => getComputedStyle(el).color);
    })
    .toBe('rgb(4, 5, 6)');
}

export async function expectInlineHtmlInjected(page, expect, id = 'ci-inline-html') {
  await expect(page.locator(`#${id}`)).toBeVisible({ timeout: 15_000 });
}

/**
 * Inline JS is subject to page CSP. Playwright Chromium blocks unsafe-inline
 * scripts, so we assert the extension inserted the <script> node rather than
 * that its side effects ran. Executable JS is covered by remote file tests.
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
