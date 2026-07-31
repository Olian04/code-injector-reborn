# Chrome Web Store — detailed reference

Distilled from:

- [Best practices](https://developer.chrome.com/docs/webstore/best-practices)
- [Creating a great listing page](https://developer.chrome.com/docs/webstore/best-listing)

Use from [SKILL.md](SKILL.md). Chromium / CWS only; Firefox/AMO is separate.

---

## Pre-submit quality gate

Copy and track:

```
CWS readiness:
- [ ] Single purpose clear in listing + product behavior
- [ ] manifest_version: 3; service worker background
- [ ] Permissions minimal and justified (see Privacy tab text)
- [ ] PRIVACY.md + CWS Privacy fields agree with actual data flows
- [ ] No analytics / tracking / crash reporters added
- [ ] No unload/beforeunload or content-script WebSocket in extension code
- [ ] Playwright e2e green for inject + popup + options (`npm run test:e2e`)
- [ ] Manual smoke: install warnings match expectations
- [ ] Listing title / summary / description accurate (no keyword spam)
- [ ] Screenshots show current UI (≤5, correct size, full bleed)
- [ ] Store icon + small promo tile ready; marquee if pursuing feature
- [ ] Category chosen (see below)
- [ ] Homepage + support URL set in developer dashboard
```

---

## Privacy tab checklist (this project)

Align with [`PRIVACY.md`](../../../PRIVACY.md):

| Topic | Expected answer for Code Injector Reborn |
|-------|------------------------------------------|
| Collects user data? | No (extension does not collect/transmit/share) |
| Analytics / ads / tracking | None |
| Remote code as extension logic | No |
| Local storage | Rules + settings in browser extension storage on device |
| URL / tab access | Used in-moment to match injection rules; not stored or sent by the extension |
| Network | Only when a *user rule* fetches a remote file or the user imports a rule list URL |
| Host permission `<all_urls>` | Required so users can target arbitrary sites with their own rules |

If code changes any of the above, update `PRIVACY.md` and CWS fields in the
same change set.

---

## Permissions UX notes

See [Permission warning guidelines](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings).

Current manifest themes (verify in packed install UI before publish):

- Broad host access (`<all_urls>`) drives strong install messaging — listing
  and Privacy policy must explain *why* (user-defined site patterns).
- `tabs` warning may be absorbed when broad host permissions are present —
  still justify `tabs` / `webNavigation` / `scripting` in single-purpose terms.
- Prefer optional permissions or `activeTab` only when a feature can truly
  work without standing host access; do not cripple core inject-on-match UX
  for optics alone.

Test permission dialogs with a packed build or the
[Extension Update Testing Tool](https://github.com/GoogleChromeLabs/extension-update-testing-tool)
before shipping permission changes — new warning-level permissions can disable
the extension until the user re-approves.

---

## Store listing checklist

### Text

| Field | Limits / guidance |
|-------|-------------------|
| Title | Clear core function; concise; unique; no keyword stuffing |
| Summary | **≤132 characters**; primary use case; no superlatives or competitor digs |
| Description | Overview paragraph + short feature list; informative; no keyword spam ([Keyword Spam policy](https://developer.chrome.com/docs/webstore/program-policies/keyword-spam)) |

Suggested framing for this product (edit for voice; keep accurate):

- Inject custom JavaScript, CSS, and HTML into sites you choose
- URL-pattern rules, local storage, no account required
- Privacy-first: no analytics; data stays on device

### Images

| Asset | Spec (from Google docs) | Notes |
|-------|-------------------------|-------|
| Store icon | Follow [extension icon best practices](https://developer.chrome.com/docs/webstore/images) | Simple brand mark; no tiny UI screenshots in the icon |
| Screenshots | **1280×800** or **640×400**; square corners; **no padding** (full bleed); 1–5 images | Show real popup/editor/options; current version; light text overlays only |
| Small promo tile | **440×280** | Homepage / category / search |
| Marquee | **1400×560** | Featured carousel; uncluttered, high-res, brand-consistent |

Promo image rules of thumb:

- Little text; not busy; works at half size
- Saturated colors often read better; avoid large white/light-gray fields
- Fill the region; defined edges
- No fake “Editor's Choice” / “#1” claims
- Branding consistent with icon + screenshots

Repo draft assets (may be legacy — refresh before upload):

- `readme-resources/screenshots/` — numbered shots, `small-tile.*`, `marquee.*`,
  `promotional-image.jpg`, `large-tile.jpg`
- Extension icons: `public/images/icon/`

### Category (extensions)

Pick the **single best** fit in the developer dashboard. For this product,
**Developer Tools** is the natural primary (debug/edit HTML/CSS/JS in-page).

Other categories from the docs (reference only): Accessibility, Art & Design,
Communication, Education, Entertainment, Functionality & UI, Games, Household,
Just for Fun, News & Weather, Privacy & Security, Shopping,
Social Media & Networking, Tools, Travel, Well-being, Workflow & Planning.

Mid-2023 remaps (if comparing old listings): Fun → Entertainment / Games /
Just for Fun; Photos → Art & Design; Productivity → Education /
Functionality & UI / Household / Privacy & Security / Tools /
Workflow & Planning; Social & Communications → Communication /
Social Media & Networking / Travel / Well-being.

Themes have a separate category list — N/A unless publishing a theme.

### Additional dashboard fields

- Item website / homepage
- Support URL
- Keep listing metadata updated when UX or permissions change

---

## Ranking / quality signals (listing page doc)

Store ranking heuristics include ratings and usage (installs vs uninstalls),
plus qualitative factors: pleasant design, clear purpose, intuitive onboarding,
ease of use. Agents cannot game rankings — improve real product + honest listing.

---

## bfcache deep dive (extension authors)

From [best practices → performance](https://developer.chrome.com/docs/webstore/best-practices):

1. **Unload handlers** — deprecated; invalidate bfcache. Prefer `pagehide`.
   For extension lifecycle after a tab closes, use `chrome.tabs.onRemoved`.
2. **WebSockets / WebRTC in content scripts** — page cannot enter bfcache.
   Move sockets to the service worker; proxy with `runtime.connect`.

**Code Injector Reborn status:**

- `public/scripts/inject.js`: `load` + `runtime.onMessage` only → OK.
- `src/background/index.ts`: `webNavigation.onCommitted`, tabs, storage,
  messaging — no page `unload`. Tab map `activeTabsData` is not cleaned on
  `tabs.onRemoved` (leak risk under long sessions; not a bfcache invalidation).
- User rules may still attach `unload` or open WebSockets after injection —
  document as user responsibility if writing help/FAQ copy.

---

## What this skill does not cover

- Firefox AMO listing, Android, or enterprise policy
- React performance (see `react-best-practices`)
- Payment / paid extensions / in-app payments
- Full program-policy legal review — escalate ambiguous policy questions to
  official docs / human review
