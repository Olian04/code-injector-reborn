---
name: chrome-web-store-best-practices
description: >-
  Chrome Web Store (CWS) listing quality, store assets, publishing readiness,
  privacy fields, permissions UX, MV3 store requirements, screenshots/promo
  images, and extension quality for store review. Use when preparing a Chrome
  Web Store listing or submission, writing listing copy, creating store icons
  or promotional images, filling CWS privacy / data-use disclosures, reviewing
  permissions for install warnings, checking MV3 compliance for CWS, or
  auditing extension quality against Chrome Web Store best practices.
---

# Chrome Web Store Best Practices (Code Injector Reborn)

Actionable guidance distilled from Google Chrome for Developers docs. **Scope:
Chromium / Chrome Web Store only.** Firefox / AMO policies are separate — do
not treat this skill as covering AMO review.

**Not** React or UI performance guidance — that lives in
[`react-best-practices`](../react-best-practices/SKILL.md).

## Official sources

- [Best practices](https://developer.chrome.com/docs/webstore/best-practices)
- [Creating a great listing page](https://developer.chrome.com/docs/webstore/best-listing)
- Related: [Permission warnings](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings),
  [User Data FAQs](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq),
  [Protecting user privacy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)

Detailed checklists: [reference.md](reference.md).

Companion Cursor rules: `cws-extension-quality.mdc`, `cws-store-listing.mdc`
— **glob triggers only** (frontmatter + pointer here / to
[reference.md](reference.md)). Do not duplicate checklist content in those
`.mdc` files; this skill is canonical.

## Project context (this repo)

| Fact | Implication for agents |
|------|------------------------|
| Privacy-first: no analytics/tracking (`PRIVACY.md`) | CWS Privacy tab + listing must match: no collection, local-only rules/storage; only network is user-triggered remote rule/file fetch |
| Already Manifest V3 | Do not add MV2 patterns; keep service worker background |
| First-release groundwork; listing not live yet | Prefer accurate disclosures over marketing hype; assets may live under `readme-resources/` until dashboard upload |
| Also ships Firefox | CWS copy/assets/policies ≠ AMO; mention Firefox only if user asks |
| Playwright e2e (`npm run test:e2e`) | Satisfies CWS “e2e tests (e.g. Puppeteer)” recommendation — keep coverage for inject/popup/options before store pushes |
| Content script: `public/scripts/inject.js` | No `unload` / WebSocket in extension inject path today — preserve that (see bfcache below) |

## When to use

Apply this skill when you:

- Draft or revise CWS title, summary (≤132 chars), description, or category
- Create/update store icon, screenshots, small promo tile, or marquee
- Fill Privacy tab / single-purpose / permission justifications
- Review `src/manifest.json` permissions or host access for store risk
- Prep a first Chrome Web Store submission or update
- Audit extension quality (compliance, security, privacy, performance, UX) for review

## How to apply

1. **Quality first** — listing cannot fix a policy or security fail. Walk
   compliance → MV3 → security → privacy → performance → UX (below).
2. **Listing second** — set accurate expectations; images and copy must match
   the shipped build.
3. **Read [reference.md](reference.md)** for asset sizes, category picks,
   privacy-tab checklist, and pre-submit gates.
4. **Keep privacy claims aligned** with `PRIVACY.md` and real behavior in
   `src/background/`, `public/scripts/inject.js`, and storage usage.

## Extension quality (store review)

### Compliance

- Single purpose; permissions only for that purpose.
- No deceptive install/update tactics; no keyword spam in listing.
- Follow [developer program policies](https://developer.chrome.com/docs/webstore/program-policies).

### Manifest V3

- New CWS items require MV3 (this project already is).
- Background = service worker; avoid persistent background pages / MV2 APIs.

### Security

- No remote-hosted extension code execution as the extension itself.
- Prefer HTTPS for any network the *extension* initiates; user rule fetches
  are user-directed — still treat them carefully in docs/disclosures.
- Never add analytics/telemetry SDKs that contradict `PRIVACY.md`.

### Privacy (CWS Privacy tab)

Disclosures must be **accurate, current, and match** the privacy policy:

- Data collected (this app: none by the extension).
- How used / shared / stored (local `storage` only for rules/settings).
- Justify broad host access (`host_permissions: <all_urls>`) honestly:
  needed to match URL patterns and inject on user-configured sites — URL used
  in-moment, not logged or transmitted by the extension.

### Performance & functionality

- Keep/run Playwright e2e before store-bound releases (`tests/e2e`).
- Manual smoke across Chromium versions when changing inject/navigation.

#### Back/forward cache (bfcache)

Do **not** add code that prevents bfcache on pages where the extension runs:

| Pitfall | Guidance |
|---------|----------|
| `unload` / `beforeunload` in content/page scripts | Never in extension inject path; use `pagehide` or `chrome.tabs.onRemoved` in the extension if needed |
| WebSocket / WebRTC in content scripts | Keep connections in the service worker; proxy via `runtime.connect` if ever needed |

**This repo (current):** `public/scripts/inject.js` only listens for `load` and
`runtime.onMessage`, then injects user JS/CSS/HTML. Extension code itself does
**not** use `unload` or WebSockets — good. **Residual risk:** *user-authored*
injected scripts may still break bfcache; that is user code, not store-policy
extension design — do not “fix” by restricting user JS unless product asks.
Optional hygiene: if adding tab bookkeeping, prefer `tabs.onRemoved` over any
page `unload` handler (`activeTabsData` today has no `onRemoved` cleanup —
memory concern, not bfcache).

### User experience

- Listing screenshots/video should teach the product before install.
- Minimize scary permission warnings; prefer optional permissions /
  `activeTab` when a feature can be scoped — but do not fake a narrower
  host model than the product needs. Document why broad access exists.
- Persistent UI (popup, options, future side panel): useful, low distraction.
- No Google sign-in required today — do not add Identity/OAuth unless product
  needs accounts (would also change privacy disclosures).

## Store listing (summary)

Full asset/copy checklist: [reference.md](reference.md#store-listing-checklist).

- **Title:** clear, concise, unique — function over keyword stuffing.
- **Summary:** ≤132 characters; real use cases; no “best/fastest” fluff or
  competitor callouts.
- **Description:** overview paragraph + short feature bullets; no keyword spam.
- **Images:** required icon + screenshots (prefer up to 5) + promo tile;
  marquee if aiming to be featured. Sharp, full-bleed, consistent branding.
- **Category (likely):** Developer Tools — JS/CSS/HTML injection for developers.
  Confirm against current dashboard list before submit.
- **Trust fields:** homepage + support URLs in the developer dashboard.

Draft assets / legacy store imagery may already exist under
`readme-resources/screenshots/` (tiles, marquee, numbered screenshots). Reuse
or refresh to match the current UI before first publish — do not upload
outdated screenshots.

## Anti-patterns

- Inventing Next.js/React “store” advice.
- Claiming analytics “for quality” while `PRIVACY.md` says none.
- Widening permissions “just in case” for CWS.
- Treating AMO/Firefox listing rules as covered here.
- Folding this into the React best-practices skill.
