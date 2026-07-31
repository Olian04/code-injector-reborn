# Extension mismatches vs upstream React best-practices

Code-Injector’s React UI is **client-only browser-extension pages**
(`src/popup`, `src/options`), not a Next.js App Router / RSC fullstack app.

Upstream rules under [`rules/`](rules/) are kept **verbatim** for every rule
that remains. This file records (1) which upstream rules were **removed** as
N/A for this project, and (2) which remaining rules need careful adaptation.

Pinned upstream: `7c180d9044c9ae2b442b567aad4e42a28dd5ed62`
([vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)).

---

## Removed — N/A / skip for this project

No Next.js server, RSC, SSR hydration, API routes, or document-level Next
resource pipeline. These upstream rules were **deleted** from `rules/` and from
`.cursor/rules/react-bp-*.mdc` (confirmed skip for this extension). Do not
reintroduce them unless the product gains a matching runtime.

| Rule basename | Why removed |
|---------------|-------------|
| `async-api-routes` | Next.js API routes / server actions waterfalls |
| `server-after-nonblocking` | Next.js `after()` |
| `server-auth-actions` | Server Actions auth |
| `server-cache-lru` | Server cross-request LRU cache |
| `server-cache-react` | `React.cache()` per-request RSC dedupe |
| `server-dedup-props` | RSC prop serialization |
| `server-hoist-static-io` | Server route handlers / OG image / font I/O |
| `server-no-shared-module-state` | RSC/SSR shared request module state |
| `server-parallel-fetching` | Server component fetch parallelization |
| `server-parallel-nested-fetching` | Nested server fetch parallelization |
| `server-serialization` | Minimize RSC → client serialization |
| `rendering-hydration-no-flicker` | SSR hydration vs localStorage flicker |
| `rendering-hydration-suppress-warning` | SSR hydration warning suppression |
| `rendering-resource-hints` | ReactDOM preload/preconnect for web documents |
| `rendering-script-defer-async` | Classic document `<script defer/async>` loading |
| `bundle-defer-third-party` | Defer analytics/logging after **hydration** |

---

## Needs your attention / adapt carefully

Valid in spirit; examples assume Next/fullstack APIs or libraries this repo may
not use. Keep the upstream text verbatim under `rules/`; map the idea to
extension equivalents when applying.

Each entry below is a **recommendation pending user approval**. Prefer the
named way forward over open-ended reinterpretation.

---

### `bundle-dynamic-imports.md`

**Upstream requires:** Lazy-load heavy components that are not needed on initial
render (examples use `next/dynamic` with `{ ssr: false }`) so large editors do
not inflate the main chunk / TTI.

**Why it mismatches:** No Next.js — `next/dynamic` and `ssr: false` do not
exist. The project already uses `React.lazy` + `Suspense` for options-in-popup
(`src/popup/components/OptionsPanel.tsx`).

**Recommended way forward:** **Adopt adapted practice** — keep the rule; when
agents cite `next/dynamic`, map 1:1 to `React.lazy(() => import(...))` +
`<Suspense>`, as in `OptionsPanel`. Do not add Next helpers.

---

### `bundle-preload.md`

**Upstream requires:** Start loading a heavy module on user intent (hover/focus)
or when a feature flag enables it, via dynamic `import()`, so the click feels
instant. Includes `typeof window !== 'undefined'` guards for SSR.

**Why it mismatches:** No SSR, so window checks are noise. Preload here is
already done via idle `ensureEditors()` / `requestIdleCallback` in
`src/popup/App.tsx` (Monaco warm), not Next preload APIs.

**Recommended way forward:** **Adopt adapted practice** — keep the rule; use
bare `void import(...)` or the existing Monaco warm path for intent/idle
preload. Ignore SSR `typeof window` guards. Prefer hover/focus preload only
when idle warm is insufficient (e.g. options chunk on gear-icon hover).

---

### `bundle-conditional.md`

**Upstream requires:** Load large modules/data only after a feature is activated
(dynamic `import()` inside an effect gated by `enabled`), with SSR window
guards in examples.

**Why it mismatches:** No SSR. The established pattern is mount-on-first-open
(`OptionsPanel` keeps the chunk mounted after first `active`), not Next
conditional helpers.

**Recommended way forward:** **Adopt adapted practice** — keep the rule; gate
heavy chunks behind feature activation the same way as `OptionsPanel`
(`mounted` after first open). Ignore SSR guards. Prefer this over eager
static imports for Monaco/options-scale UI.

---

### `async-suspense-boundaries.md`

**Upstream requires:** Put Suspense around slow data regions so shell UI paints
while async children resolve; examples use async Server Components, streaming,
and `use(promise)` for shared fetches.

**Why it mismatches:** No RSC/streaming. Suspense in this repo is for
`React.lazy` code-split boundaries, not server data streaming. Async storage
work uses promises/`useEffect`, not async components.

**Recommended way forward:** **Document project convention in SKILL** (thin
note) — keep the rule for the “don’t block the shell” idea; apply Suspense
primarily to `lazy()` boundaries (see `OptionsPanel`). Do **not** introduce
RSC-style async components or `use(promise)` data loading unless React/data
patterns change. For storage waterfalls, prefer `async-parallel` /
`async-defer-await` instead.

---

### `async-dependencies.md`

**Upstream requires:** Maximize parallelism when tasks have partial
dependencies; primary example uses the `better-all` package. The same file also
shows a no-dependency alternative with early promise creation + `Promise.all`.

**Why it mismatches:** Adding `better-all` for a short-lived popup is unlikely
to pay for itself; storage/tab message graphs are small.

**Recommended way forward:** **Leave as-is and ignore examples** for
`better-all` — keep the rule; always use the file’s **Alternative without extra
dependencies** (`userPromise` / `.then` / `Promise.all`). Do not add
`better-all` unless a real multi-hop async graph appears.

---

### `client-localstorage-schema.md`

**Upstream requires:** Version keys, store minimal fields, migrate schemas, and
wrap `localStorage` access in try/catch (quota / private mode).

**Why it mismatches:** Primary persistence is `browser.storage.local` via
`src/shared/storage.ts`, not `localStorage`. `localStorage` is used only for
sync theme first paint (`THEME_CACHE_KEY` / `public/theme-boot.js`).

**Recommended way forward:** **Adopt adapted practice** — keep the rule; apply
versioning/minimization/migration discipline to **`browser.storage` shapes**
(rules, settings) and keep `localStorage` limited to the theme mirror (already
try/caught in `applyTheme`). Do not move rules/settings into `localStorage`.

---

### `client-swr-dedup.md`

**Upstream requires:** Use SWR (or immutable/mutation helpers) so multiple
component instances share one request, with cache and revalidation.

**Why it mismatches:** No SWR, no HTTP client fetch layer for UI data. State
comes from `browser.storage` + `storage.onChanged` and local React state.
Popup lifetime is short; request fan-out is not a current problem.

**Recommended way forward:** **Remove rule** — delete
`rules/client-swr-dedup.md` and the matching `.cursor/rules/react-bp-*.mdc`,
and move it to the Removed table. Do not add SWR. If fan-out ever appears,
dedupe with a shared promise/module cache or storage subscription first.

---

### `js-cache-storage.md`

**Upstream requires:** Cache synchronous `localStorage` / cookie reads in a
module-level `Map` (not a hook), keep writes in sync, and invalidate on
external `storage` / visibility changes.

**Why it mismatches:** Most reads are async `browser.storage`, not sync
`localStorage`. Sync `localStorage` is only the theme boot mirror. Cross-context
updates use `browser.storage.onChanged`, not the `window` `storage` event.

**Recommended way forward:** **Add thin project note** — keep the rule; map
examples to (1) in-memory cache for repeated **`THEME_CACHE_KEY` /
`localStorage`** reads if they proliferate, and (2) optional session `Map` for
hot `browser.storage` keys invalidated via `browser.storage.onChanged`. Do not
treat every `getSettings()` as needing a cache — popup sessions are short.

---

### `rendering-activity.md`

**Upstream requires:** Use React’s `<Activity mode="visible" | "hidden">` to
preserve state/DOM for expensive UI that toggles visibility often.

**Why it mismatches:** Runtime is React **18.3**; `<Activity>` is not available
(React 19+ experimental/stable surface). Show/hide today uses CSS/panels and
keeping mounted children (`OptionsPanel` `mounted` flag).

**Recommended way forward:** **Leave as-is and ignore examples** until a React
19+ upgrade. Keep the file so an upgrade can adopt it; do not polyfill or
import experimental APIs. For now, preserve state by keeping expensive subtrees
mounted (as `OptionsPanel` already does).

---

### `js-request-idle-callback.md`

**Upstream requires:** Schedule non-critical work with `requestIdleCallback`
(optional timeout, chunking, `setTimeout` fallback) so analytics, prefetch, and
lazy init do not block interaction.

**Why it mismatches:** Browser-action popups are short-lived; idle work can be
cancelled when the popup closes. The project already warms Monaco this way in
`App.tsx` (`timeout: 1000` + `cancelIdleCallback` on cleanup).

**Recommended way forward:** **Adopt adapted practice** — keep the rule; follow
the existing Monaco warm pattern (idle + timeout + cancel on unmount). Use for
prefetch/warm only — never for work that must finish before the user can act
or before the popup may close (saves, injects, user-visible loads).

---

## Project adaptations (pending approval)

Summary of the recommendations above — **not yet binding conventions**. After
you approve, promote accepted items into `SKILL.md` “Project adaptations” and
execute any **Remove rule** actions.

| Rule | Recommendation |
|------|----------------|
| `bundle-dynamic-imports` | Adopt adapted: `next/dynamic` → `React.lazy` + `Suspense` (`OptionsPanel`) |
| `bundle-preload` | Adopt adapted: bare `import()` / existing Monaco idle warm; ignore SSR guards |
| `bundle-conditional` | Adopt adapted: mount-on-first-open like `OptionsPanel`; ignore SSR guards |
| `async-suspense-boundaries` | Document convention: Suspense for `lazy()` only; not RSC/`use()` data |
| `async-dependencies` | Leave as-is; ignore `better-all`; use Promise orchestration alternative |
| `client-localstorage-schema` | Adopt adapted: version/minimize `browser.storage`; `localStorage` = theme only |
| `client-swr-dedup` | **Remove rule** (no SWR) |
| `js-cache-storage` | Thin note: Map-cache theme `localStorage` / optional hot `browser.storage` |
| `rendering-activity` | Leave as-is; ignore until React 19+ |
| `js-request-idle-callback` | Adopt adapted: idle warm OK; cancel on unmount; not for must-finish work |

---

## Apply as-is

Pure client React / JS patterns that fit the extension popup/options UI.

### Async

- `async-parallel.md`
- `async-defer-await.md`
- `async-cheap-condition-before-await.md`

### Bundle

- `bundle-barrel-imports.md`
- `bundle-analyzable-paths.md`

### Client

- `client-event-listeners.md`
- `client-passive-event-listeners.md`

### Re-render

- `rerender-defer-reads.md`
- `rerender-dependencies.md`
- `rerender-derived-state-no-effect.md`
- `rerender-derived-state.md`
- `rerender-functional-setstate.md`
- `rerender-lazy-state-init.md`
- `rerender-memo.md`
- `rerender-memo-with-default-value.md`
- `rerender-move-effect-to-event.md`
- `rerender-no-inline-components.md`
- `rerender-simple-expression-in-memo.md`
- `rerender-split-combined-hooks.md`
- `rerender-transitions.md`
- `rerender-use-deferred-value.md`
- `rerender-use-ref-transient-values.md`

### Rendering

- `rendering-animate-svg-wrapper.md`
- `rendering-conditional-render.md`
- `rendering-content-visibility.md`
- `rendering-hoist-jsx.md`
- `rendering-svg-precision.md`
- `rendering-usetransition-loading.md`

### JavaScript

- `js-batch-dom-css.md`
- `js-cache-function-results.md`
- `js-cache-property-access.md`
- `js-combine-iterations.md`
- `js-early-exit.md`
- `js-flatmap-filter.md`
- `js-hoist-regexp.md`
- `js-index-maps.md`
- `js-length-check-first.md`
- `js-min-max-loop.md`
- `js-set-map-lookups.md`
- `js-tosorted-immutable.md`

### Advanced

- `advanced-effect-event-deps.md`
- `advanced-event-handler-refs.md`
- `advanced-init-once.md`
- `advanced-use-latest.md`
