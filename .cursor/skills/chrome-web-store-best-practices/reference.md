# Chrome Web Store — reference

From [Best practices](https://developer.chrome.com/docs/webstore/best-practices) · [Great listing](https://developer.chrome.com/docs/webstore/best-listing). CWS only. Entry: [SKILL.md](SKILL.md).

## Pre-submit gate

```
CWS readiness:
- [ ] Single purpose clear in listing + behavior
- [ ] manifest_version: 3; service worker background
- [ ] Permissions minimal + justified
- [ ] PRIVACY.md + CWS Privacy match real data flows
- [ ] No analytics / tracking / crash reporters
- [ ] No unload/beforeunload or content-script WebSocket in extension code
- [ ] Playwright e2e green (`npm run test:e2e`)
- [ ] Manual smoke: install warnings match expectations
- [ ] Title / summary / description accurate (no keyword spam)
- [ ] Screenshots current UI (≤5, correct size, full bleed)
- [ ] Store icon + small promo tile; marquee if pursuing feature
- [ ] Category chosen
- [ ] Homepage + support URL in dashboard
```

## Privacy tab (this project)

Align [`PRIVACY.md`](../../../PRIVACY.md):

| Topic | Expected |
|-------|----------|
| Collects user data? | No |
| Analytics / ads / tracking | None |
| Remote code as extension logic | No |
| Local storage | Rules + settings on device |
| URL / tab access | In-moment match; not stored/sent by extension |
| Network | Only user rule remote fetch / import URL |
| Host `<all_urls>` | Required for arbitrary user-targeted sites |

Code changes any row → update `PRIVACY.md` + CWS fields same change.

## Permissions UX

[Permission warnings](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings). Verify packed install UI before publish.

- `<all_urls>` → strong install messaging; explain user-defined patterns
- `tabs` warning may absorb under broad hosts — still justify `tabs` / `webNavigation` / `scripting`
- Optional/`activeTab` only if feature works without standing host access

Test with packed build or [Extension Update Testing Tool](https://github.com/GoogleChromeLabs/extension-update-testing-tool) — new warning-level perms can disable until re-approve.

## Store listing

### Text

| Field | Guidance |
|-------|----------|
| Title | Core function; concise; unique; no stuffing |
| Summary | **≤132 chars**; primary use case; no superlatives/competitor digs |
| Description | Overview + short features; no keyword spam ([policy](https://developer.chrome.com/docs/webstore/program-policies/keyword-spam)) |

Suggested framing: inject JS/CSS/HTML on chosen sites · URL-pattern rules, local storage, no account · privacy-first, no analytics.

### Images

| Asset | Spec | Notes |
|-------|------|-------|
| Store icon | [Icon best practices](https://developer.chrome.com/docs/webstore/images) | Brand mark; no tiny UI shots |
| Screenshots | **1280×800** or **640×400**; square corners; **no padding**; 1–5 | Real current UI; light overlays only |
| Small promo | **440×280** | Homepage / category / search |
| Marquee | **1400×560** | Featured; uncluttered, brand-consistent |

Promo: little text; works at half size; saturated colors; fill region; no fake “#1”/Editor's Choice.

Draft: `readme-resources/screenshots/` · icons `public/images/icon/`.

### Category

**Developer Tools** natural primary. Confirm dashboard list. Themes N/A.

Other (ref only): Accessibility, Art & Design, Communication, Education, Entertainment, Functionality & UI, Games, Household, Just for Fun, News & Weather, Privacy & Security, Shopping, Social Media & Networking, Tools, Travel, Well-being, Workflow & Planning.

### Dashboard fields

Homepage · Support URL · update when UX/perms change.

## Ranking signals

Ratings, installs vs uninstalls, clear purpose, pleasant UX. Improve product + honest listing — don't game.

## bfcache

1. Unload handlers invalidate bfcache → prefer `pagehide`; tab close → `chrome.tabs.onRemoved`.
2. WebSocket/WebRTC in content scripts → move to SW; proxy `runtime.connect`.

**Status:** `inject.js` = `load` + `runtime.onMessage` → OK. Background has no page `unload`. `activeTabsData` not cleaned on `tabs.onRemoved` (leak risk, not bfcache). User rules may still break bfcache — document as user responsibility in help/FAQ.

## Out of scope

AMO/Firefox · React perf · paid/IAP · full legal policy review
