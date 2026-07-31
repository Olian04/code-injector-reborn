# React Best Practices — index

Authority: [`rules/`](rules/). Upstream @ `7c180d9`; adapted → [`MISMATCHES.md`](MISMATCHES.md). Index only — open rule file for body.

Metadata: [`rules/_sections.md`](rules/_sections.md)

## 1. Waterfalls (`async-`)

| File | Title | Notes |
|------|-------|-------|
| [async-cheap-condition-before-await.md](rules/async-cheap-condition-before-await.md) | Check Cheap Conditions Before Async Flags | verbatim |
| [async-defer-await.md](rules/async-defer-await.md) | Defer Await Until Needed | verbatim |
| [async-dependencies.md](rules/async-dependencies.md) | Dependency-Based Parallelization | adapted |
| [async-parallel.md](rules/async-parallel.md) | Promise.all() for Independent Operations | verbatim |
| [async-suspense-boundaries.md](rules/async-suspense-boundaries.md) | Strategic Suspense Boundaries | adapted |

## 2. Bundle (`bundle-`)

| File | Title | Notes |
|------|-------|-------|
| [bundle-analyzable-paths.md](rules/bundle-analyzable-paths.md) | Prefer Statically Analyzable Paths | verbatim |
| [bundle-barrel-imports.md](rules/bundle-barrel-imports.md) | Avoid Barrel File Imports | verbatim |
| [bundle-conditional.md](rules/bundle-conditional.md) | Conditional Module Loading | adapted |
| [bundle-dynamic-imports.md](rules/bundle-dynamic-imports.md) | Dynamic Imports for Heavy Components | adapted |
| [bundle-preload.md](rules/bundle-preload.md) | Preload Based on User Intent | adapted |

## 3. Client (`client-`)

| File | Title | Notes |
|------|-------|-------|
| [client-event-listeners.md](rules/client-event-listeners.md) | Deduplicate Global Event Listeners | adapted |
| [client-localstorage-schema.md](rules/client-localstorage-schema.md) | Version and Minimize Extension Storage Data | adapted |
| [client-passive-event-listeners.md](rules/client-passive-event-listeners.md) | Use Passive Event Listeners for Scrolling Performance | verbatim |

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

## Removed

Upstream `rendering-` / `js-` / `advanced-` dropped — focus async/bundle/client/rerender. See [`MISMATCHES.md`](MISMATCHES.md).
