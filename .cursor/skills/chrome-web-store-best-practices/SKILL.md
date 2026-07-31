---
name: chrome-web-store-best-practices
description: >-
  CWS listing quality, store assets, privacy fields, permissions UX, MV3,
  screenshots/promo, store-review readiness. Use for listing/submission copy,
  icons/promo images, Privacy tab, permission review, MV3/CWS audit.
---

# Chrome Web Store Best Practices (Code Injector Reborn)

Chromium / CWS only. Not AMO/Firefox. Not React perf → [`react-best-practices`](../react-best-practices/SKILL.md).

**Sources:** [Best practices](https://developer.chrome.com/docs/webstore/best-practices) · [Great listing](https://developer.chrome.com/docs/webstore/best-listing) · [Permission warnings](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings) · [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)

Checklists: [reference.md](reference.md). Companion `.cursor/rules/chrome-web-store.mdc` = glob trigger only.

## Project context

| Fact | Implication |
|------|-------------|
| No analytics (`PRIVACY.md`) | CWS Privacy + listing match: local-only; network = user-triggered remote rule/file fetch |
| Already MV3 | No MV2; keep service worker |
| First-release groundwork | Accurate disclosures > hype; assets may live in `readme-resources/` |
| Also Firefox | CWS ≠ AMO |
| Playwright e2e | `npm run test:e2e` covers CWS e2e rec |
| Inject: `public/scripts/inject.js` | No `unload` / WebSocket in inject path — keep |

## When / how

Listing copy, store assets, Privacy tab, `src/manifest.json` perms, first submit/update, quality audit → apply.

1. Quality first: compliance → MV3 → security → privacy → perf → UX.
2. Listing second: copy/images match shipped build.
3. [reference.md](reference.md) for sizes/checklists.
4. Align claims with `PRIVACY.md` + real `src/background/`, `inject.js`, storage.

## Extension quality

**Compliance:** Single purpose; minimal perms; no deceptive install; no keyword spam; [program policies](https://developer.chrome.com/docs/webstore/program-policies).

**MV3:** Required for new CWS items. Background = service worker.

**Security:** No remote-hosted extension code. Prefer HTTPS for extension-initiated net. No analytics SDKs vs `PRIVACY.md`.

**Privacy tab:** Accurate + match policy. Collects: none. Storage: local rules/settings. Justify `<all_urls>`: match/inject user rules; URL in-moment, not logged/transmitted.

**Perf:** Playwright green before store push. Smoke Chromium on inject/nav changes.

**bfcache:** Never `unload`/`beforeunload` in inject path — use `pagehide` or `tabs.onRemoved`. WebSocket/WebRTC → service worker + `runtime.connect`. Current `inject.js`: `load` + `runtime.onMessage` only — OK. User-authored injected scripts may still break bfcache — not store-policy extension design. Optional: `tabs.onRemoved` cleanup for `activeTabsData` (memory, not bfcache).

**UX:** Screenshots teach product. Minimize scary warnings; optional/`activeTab` only if feature truly scoped — don't fake narrow hosts. No Google sign-in today.

## Store listing (summary)

Full: [reference.md](reference.md#store-listing-checklist).

- **Title:** clear, unique; function > stuffing
- **Summary:** ≤132 chars; real use cases; no “best/fastest”
- **Description:** overview + feature bullets; no keyword spam
- **Images:** icon + ≤5 screenshots + promo tile; marquee if featured
- **Category (likely):** Developer Tools — confirm in dashboard
- **Trust:** homepage + support URLs

Draft assets: `readme-resources/screenshots/`. Refresh to current UI before upload.

## Anti-patterns

- Next/React “store” advice · analytics claims vs `PRIVACY.md` · widen perms “just in case” · treat AMO as covered · fold into React skill
