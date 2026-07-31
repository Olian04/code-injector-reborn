# React Best Practices — reference index

Authority: verbatim files in [`rules/`](rules/), synced from
[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices/rules)
at `7c180d9044c9ae2b442b567aad4e42a28dd5ed62`, then trimmed for this
browser-extension project (see [`MISMATCHES.md`](MISMATCHES.md)).

Do not use this file as a substitute for the rule bodies. Use it only to find
the right `rules/<name>.md` file. Extension applicability flags:
[`MISMATCHES.md`](MISMATCHES.md).

## Metadata

- [`rules/_sections.md`](rules/_sections.md) — section order, impact, descriptions

## 1. Eliminating Waterfalls (`async-`)

| File | Title |
|------|-------|
| [async-cheap-condition-before-await.md](rules/async-cheap-condition-before-await.md) | Check Cheap Conditions Before Async Flags |
| [async-defer-await.md](rules/async-defer-await.md) | Defer Await Until Needed |
| [async-dependencies.md](rules/async-dependencies.md) | Dependency-Based Parallelization |
| [async-parallel.md](rules/async-parallel.md) | Promise.all() for Independent Operations |
| [async-suspense-boundaries.md](rules/async-suspense-boundaries.md) | Strategic Suspense Boundaries |

## 2. Bundle Size (`bundle-`)

| File | Title |
|------|-------|
| [bundle-analyzable-paths.md](rules/bundle-analyzable-paths.md) | Prefer Statically Analyzable Paths |
| [bundle-barrel-imports.md](rules/bundle-barrel-imports.md) | Avoid Barrel File Imports |
| [bundle-conditional.md](rules/bundle-conditional.md) | Conditional Module Loading |
| [bundle-dynamic-imports.md](rules/bundle-dynamic-imports.md) | Dynamic Imports for Heavy Components |
| [bundle-preload.md](rules/bundle-preload.md) | Preload Based on User Intent |

## 3. Client-Side Data (`client-`)

| File | Title |
|------|-------|
| [client-event-listeners.md](rules/client-event-listeners.md) | Deduplicate Global Event Listeners |
| [client-localstorage-schema.md](rules/client-localstorage-schema.md) | Version and Minimize localStorage Data |
| [client-passive-event-listeners.md](rules/client-passive-event-listeners.md) | Use Passive Event Listeners for Scrolling Performance |
| [client-swr-dedup.md](rules/client-swr-dedup.md) | Use SWR for Automatic Deduplication |

## 4. Re-render (`rerender-`)

| File | Title |
|------|-------|
| [rerender-defer-reads.md](rules/rerender-defer-reads.md) | Defer State Reads to Usage Point |
| [rerender-dependencies.md](rules/rerender-dependencies.md) | Narrow Effect Dependencies |
| [rerender-derived-state-no-effect.md](rules/rerender-derived-state-no-effect.md) | Calculate Derived State During Rendering |
| [rerender-derived-state.md](rules/rerender-derived-state.md) | Subscribe to Derived State |
| [rerender-functional-setstate.md](rules/rerender-functional-setstate.md) | Use Functional setState Updates |
| [rerender-lazy-state-init.md](rules/rerender-lazy-state-init.md) | Use Lazy State Initialization |
| [rerender-memo-with-default-value.md](rules/rerender-memo-with-default-value.md) | Extract Default Non-primitive Parameter Value from Memoized Component to Constant |
| [rerender-memo.md](rules/rerender-memo.md) | Extract to Memoized Components |
| [rerender-move-effect-to-event.md](rules/rerender-move-effect-to-event.md) | Put Interaction Logic in Event Handlers |
| [rerender-no-inline-components.md](rules/rerender-no-inline-components.md) | Don't Define Components Inside Components |
| [rerender-simple-expression-in-memo.md](rules/rerender-simple-expression-in-memo.md) | Do not wrap a simple expression with a primitive result type in useMemo |
| [rerender-split-combined-hooks.md](rules/rerender-split-combined-hooks.md) | Split Combined Hook Computations |
| [rerender-transitions.md](rules/rerender-transitions.md) | Use Transitions for Non-Urgent Updates |
| [rerender-use-deferred-value.md](rules/rerender-use-deferred-value.md) | Use useDeferredValue for Expensive Derived Renders |
| [rerender-use-ref-transient-values.md](rules/rerender-use-ref-transient-values.md) | Use useRef for Transient Values |

## 5. Rendering (`rendering-`)

| File | Title |
|------|-------|
| [rendering-activity.md](rules/rendering-activity.md) | Use Activity Component for Show/Hide |
| [rendering-animate-svg-wrapper.md](rules/rendering-animate-svg-wrapper.md) | Animate SVG Wrapper Instead of SVG Element |
| [rendering-conditional-render.md](rules/rendering-conditional-render.md) | Use Explicit Conditional Rendering |
| [rendering-content-visibility.md](rules/rendering-content-visibility.md) | CSS content-visibility for Long Lists |
| [rendering-hoist-jsx.md](rules/rendering-hoist-jsx.md) | Hoist Static JSX Elements |
| [rendering-svg-precision.md](rules/rendering-svg-precision.md) | Optimize SVG Precision |
| [rendering-usetransition-loading.md](rules/rendering-usetransition-loading.md) | Use useTransition Over Manual Loading States |

## 6. JavaScript (`js-`)

| File | Title |
|------|-------|
| [js-batch-dom-css.md](rules/js-batch-dom-css.md) | Avoid Layout Thrashing |
| [js-cache-function-results.md](rules/js-cache-function-results.md) | Cache Repeated Function Calls |
| [js-cache-property-access.md](rules/js-cache-property-access.md) | Cache Property Access in Loops |
| [js-cache-storage.md](rules/js-cache-storage.md) | Cache Storage API Calls |
| [js-combine-iterations.md](rules/js-combine-iterations.md) | Combine Multiple Array Iterations |
| [js-early-exit.md](rules/js-early-exit.md) | Early Return from Functions |
| [js-flatmap-filter.md](rules/js-flatmap-filter.md) | Use flatMap to Map and Filter in One Pass |
| [js-hoist-regexp.md](rules/js-hoist-regexp.md) | Hoist RegExp Creation |
| [js-index-maps.md](rules/js-index-maps.md) | Build Index Maps for Repeated Lookups |
| [js-length-check-first.md](rules/js-length-check-first.md) | Early Length Check for Array Comparisons |
| [js-min-max-loop.md](rules/js-min-max-loop.md) | Use Loop for Min/Max Instead of Sort |
| [js-request-idle-callback.md](rules/js-request-idle-callback.md) | Defer Non-Critical Work with requestIdleCallback |
| [js-set-map-lookups.md](rules/js-set-map-lookups.md) | Use Set/Map for O(1) Lookups |
| [js-tosorted-immutable.md](rules/js-tosorted-immutable.md) | Use toSorted() Instead of sort() for Immutability |

## 7. Advanced (`advanced-`)

| File | Title |
|------|-------|
| [advanced-effect-event-deps.md](rules/advanced-effect-event-deps.md) | Do Not Put Effect Events in Dependency Arrays |
| [advanced-event-handler-refs.md](rules/advanced-event-handler-refs.md) | Store Event Handlers in Refs |
| [advanced-init-once.md](rules/advanced-init-once.md) | Initialize App Once, Not Per Mount |
| [advanced-use-latest.md](rules/advanced-use-latest.md) | useEffectEvent for Stable Callback Refs |
