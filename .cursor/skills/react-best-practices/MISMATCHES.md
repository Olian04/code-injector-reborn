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
not use. Keep the upstream text; map the idea to extension equivalents.

| Rule file | Adaptation note |
|-----------|-----------------|
| `bundle-dynamic-imports.md` | Examples use `next/dynamic`. Prefer `React.lazy` + `Suspense` (see `OptionsPanel`). |
| `bundle-preload.md` | Preload-on-intent patterns may use Next dynamic preload APIs; use dynamic `import()` / webpack prefetch equivalents if needed. |
| `bundle-conditional.md` | Same idea (load on feature activation); ignore Next-specific import helpers if present. |
| `async-suspense-boundaries.md` | Aimed at RSC/streaming Suspense. Here: use Suspense mainly for `lazy()` boundaries, not SSR streaming. |
| `async-dependencies.md` | Suggests `better-all`; fine to use plain `Promise` orchestration if that dependency is unwanted. |
| `client-localstorage-schema.md` | Version/minimize persisted shapes — map to `browser.storage` (`src/shared/storage.ts`), not `localStorage`. |
| `client-swr-dedup.md` | SWR not required today; chrome.storage + local state is fine unless request fan-out appears. |
| `js-cache-storage.md` | Examples target `localStorage`; same caching idea can apply to repeated `browser.storage` reads in a session. |
| `rendering-activity.md` | Requires React `<Activity>` (newer React). Only if the runtime exposes it and a show/hide case needs state preservation. |
| `js-request-idle-callback.md` | Fine for deferring non-critical work; popup lifetime is short — don’t schedule work that must finish before the popup closes. |

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
