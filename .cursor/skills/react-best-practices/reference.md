# React Best Practices — reference index

**Canonical rules:** [`.cursor/rules/react-bp-*.mdc`](../../rules/) — based on
[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices/rules)
at `7c180d9044c9ae2b442b567aad4e42a28dd5ed62`, then trimmed and (where noted)
adapted for this browser-extension project (see [`MISMATCHES.md`](MISMATCHES.md)).

Most rules are still verbatim upstream. Adapted rules are marked in
[`MISMATCHES.md` → Reworded on disk](MISMATCHES.md#reworded-on-disk) and carry
an “Adapted for Code Injector Reborn” note in the `.mdc` body.

Do not use this file as a substitute for the rule bodies. Use it only to find
the right `react-bp-<name>.mdc` file.

Each rule has `alwaysApply: false` and globs:
`src/popup/**/*.{tsx,ts}`, `src/options/**/*.{tsx,ts}`.

## Sections (order / impact)

Upstream categories **Server (`server`)**, **Rendering (`rendering`)**,
**JavaScript (`js`)**, and **Advanced (`advanced`)** were removed for
Code-Injector. See [`MISMATCHES.md`](MISMATCHES.md).

### 1. Eliminating Waterfalls (`async`)

**Impact:** CRITICAL  
Waterfalls are the #1 performance killer. Each sequential await adds full
network latency. Eliminating them yields the largest gains.

### 2. Bundle Size Optimization (`bundle`)

**Impact:** CRITICAL  
Reducing initial bundle size improves Time to Interactive and Largest
Contentful Paint.

### 3. Client-Side Data Fetching (`client`)

**Impact:** MEDIUM-HIGH  
Efficient client storage and event patterns for the extension UI
(`browser.storage`, listeners). Upstream SWR dedup rule was removed.

### 4. Re-render Optimization (`rerender`)

**Impact:** MEDIUM  
Reducing unnecessary re-renders minimizes wasted computation and improves UI
responsiveness.

## 1. Eliminating Waterfalls (`async-`)

| Rule | Title | Notes |
|------|-------|-------|
| [react-bp-async-cheap-condition-before-await.mdc](../../rules/react-bp-async-cheap-condition-before-await.mdc) | Check Cheap Conditions Before Async Flags | verbatim |
| [react-bp-async-defer-await.mdc](../../rules/react-bp-async-defer-await.mdc) | Defer Await Until Needed | verbatim |
| [react-bp-async-dependencies.mdc](../../rules/react-bp-async-dependencies.mdc) | Dependency-Based Parallelization | adapted |
| [react-bp-async-parallel.mdc](../../rules/react-bp-async-parallel.mdc) | Promise.all() for Independent Operations | verbatim |
| [react-bp-async-suspense-boundaries.mdc](../../rules/react-bp-async-suspense-boundaries.mdc) | Strategic Suspense Boundaries | adapted |

## 2. Bundle Size (`bundle-`)

| Rule | Title | Notes |
|------|-------|-------|
| [react-bp-bundle-analyzable-paths.mdc](../../rules/react-bp-bundle-analyzable-paths.mdc) | Prefer Statically Analyzable Paths | verbatim |
| [react-bp-bundle-barrel-imports.mdc](../../rules/react-bp-bundle-barrel-imports.mdc) | Avoid Barrel File Imports | verbatim |
| [react-bp-bundle-conditional.mdc](../../rules/react-bp-bundle-conditional.mdc) | Conditional Module Loading | adapted |
| [react-bp-bundle-dynamic-imports.mdc](../../rules/react-bp-bundle-dynamic-imports.mdc) | Dynamic Imports for Heavy Components | adapted |
| [react-bp-bundle-preload.mdc](../../rules/react-bp-bundle-preload.mdc) | Preload Based on User Intent | adapted |

## 3. Client-Side Data (`client-`)

| Rule | Title | Notes |
|------|-------|-------|
| [react-bp-client-event-listeners.mdc](../../rules/react-bp-client-event-listeners.mdc) | Deduplicate Global Event Listeners | adapted |
| [react-bp-client-localstorage-schema.mdc](../../rules/react-bp-client-localstorage-schema.mdc) | Version and Minimize Extension Storage Data | adapted |
| [react-bp-client-passive-event-listeners.mdc](../../rules/react-bp-client-passive-event-listeners.mdc) | Use Passive Event Listeners for Scrolling Performance | verbatim |

## 4. Re-render (`rerender-`)

| Rule | Title |
|------|-------|
| [react-bp-rerender-defer-reads.mdc](../../rules/react-bp-rerender-defer-reads.mdc) | Defer State Reads to Usage Point |
| [react-bp-rerender-dependencies.mdc](../../rules/react-bp-rerender-dependencies.mdc) | Narrow Effect Dependencies |
| [react-bp-rerender-derived-state-no-effect.mdc](../../rules/react-bp-rerender-derived-state-no-effect.mdc) | Calculate Derived State During Rendering |
| [react-bp-rerender-derived-state.mdc](../../rules/react-bp-rerender-derived-state.mdc) | Subscribe to Derived State |
| [react-bp-rerender-functional-setstate.mdc](../../rules/react-bp-rerender-functional-setstate.mdc) | Use Functional setState Updates |
| [react-bp-rerender-lazy-state-init.mdc](../../rules/react-bp-rerender-lazy-state-init.mdc) | Use Lazy State Initialization |
| [react-bp-rerender-memo-with-default-value.mdc](../../rules/react-bp-rerender-memo-with-default-value.mdc) | Extract Default Non-primitive Parameter Value from Memoized Component to Constant |
| [react-bp-rerender-memo.mdc](../../rules/react-bp-rerender-memo.mdc) | Extract to Memoized Components |
| [react-bp-rerender-move-effect-to-event.mdc](../../rules/react-bp-rerender-move-effect-to-event.mdc) | Put Interaction Logic in Event Handlers |
| [react-bp-rerender-no-inline-components.mdc](../../rules/react-bp-rerender-no-inline-components.mdc) | Don't Define Components Inside Components |
| [react-bp-rerender-simple-expression-in-memo.mdc](../../rules/react-bp-rerender-simple-expression-in-memo.mdc) | Do not wrap a simple expression with a primitive result type in useMemo |
| [react-bp-rerender-split-combined-hooks.mdc](../../rules/react-bp-rerender-split-combined-hooks.mdc) | Split Combined Hook Computations |
| [react-bp-rerender-transitions.mdc](../../rules/react-bp-rerender-transitions.mdc) | Use Transitions for Non-Urgent Updates |
| [react-bp-rerender-use-deferred-value.mdc](../../rules/react-bp-rerender-use-deferred-value.mdc) | Use useDeferredValue for Expensive Derived Renders |
| [react-bp-rerender-use-ref-transient-values.mdc](../../rules/react-bp-rerender-use-ref-transient-values.mdc) | Use useRef for Transient Values |

## Removed categories

Upstream sections **5 Rendering (`rendering-`)**, **6 JavaScript (`js-`)**, and
**7 Advanced (`advanced-`)** were dropped to focus agents on extension-relevant
async, bundle, client, and re-render guidance. See [`MISMATCHES.md`](MISMATCHES.md).
