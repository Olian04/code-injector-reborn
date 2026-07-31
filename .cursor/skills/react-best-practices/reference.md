# React Best Practices — extension reference

Distilled from [Vercel react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices). Read upstream rule files when you need full incorrect/correct examples.

## Apply (high impact here)

### Waterfalls (`async-*`)

- **`async-parallel`**: Independent `browser.storage` / messaging reads → `Promise.all`.
- **`async-defer-await`**: Don't await work on paths that return early (e.g. skip editor init when panel closed).
- **`async-cheap-condition-before-await`**: Sync guards (null tab, disabled rule) before expensive async.

**N/A:** `async-api-routes` (no Next API routes). `async-suspense-boundaries` for SSR streaming — use Suspense only for `lazy()` boundaries (already done for options).

### Bundle (`bundle-*`)

- **`bundle-dynamic-imports`**: Use `React.lazy` + `Suspense` for heavy/optional UI (see `src/popup/components/OptionsPanel.tsx`).
- **`bundle-conditional`**: Load Monaco / options / modals only when the feature activates.
- **`bundle-barrel-imports`**: Prefer direct imports over barrels that re-export heavy modules.
- **`bundle-analyzable-paths`**: Static import paths so bundlers can split cleanly.
- **`bundle-preload`**: Optional — preload on hover/intent if a panel is slow to open.

**Adapt:** Anywhere upstream says `next/dynamic`, use `React.lazy` instead.

### Re-render (`rerender-*`)

- **`rerender-no-inline-components`**: Define components at module scope.
- **`rerender-derived-state-no-effect`**: Derive during render; don't `useEffect` to copy props→state.
- **`rerender-defer-reads`**: Don't subscribe to state only needed inside click handlers (use refs or read at event time when appropriate).
- **`rerender-lazy-state-init`**: `useState(() => expensive())` for costly initial values.
- **`rerender-functional-setstate`**: Functional updates when next state depends on previous.
- **`rerender-dependencies`**: Prefer primitive effect deps.
- **`rerender-transitions` / `rerender-use-deferred-value`**: Use for non-urgent updates / expensive derived UI when the change warrants it.

**Caution:** Upstream `rerender-memo` encourages extracting memoized children. Prefer **extraction** first; wrap with `memo` only when profiling shows benefit. Don't sprinkle `useMemo`/`useCallback` prophylactically.

### Client (`client-*`)

- **`client-event-listeners`**: One shared listener for global DOM/`browser` events when many consumers need the same signal.
- **`client-passive-event-listeners`**: `{ passive: true }` for scroll/touch when not calling `preventDefault`.
- **`client-localstorage-schema`**: Version + minimize persisted settings/rules shapes (maps to `browser.storage`).

**Optional:** `client-swr-dedup` — not used today; chrome.storage + local state is fine unless request fan-out appears.

### Rendering / JS / advanced (as needed)

- **`rendering-conditional-render`**: Prefer ternary over `&&` when the left side can be `0`/`''`.
- **`rendering-content-visibility`**: Consider for very long rules lists.
- **`rendering-hoist-jsx`**: Static JSX outside components when truly static.
- **`js-*`**: Index maps, early exits, hoist RegExp on hot paths (URL matching, list filters).
- **`advanced-effect-event-deps`**: Don't put `useEffectEvent` results in effect deps.
- **`advanced-init-once`**: Module-level one-time init vs remount thrash.

## N/A for this extension (skip unless proven relevant)

Entire **`server-*`** category: RSC, `React.cache`, server actions auth, `after()`, SSR serialization, shared request module state.

Also typically N/A:

| Upstream | Why |
|----------|-----|
| `rendering-hydration-*` | No SSR hydration of popup/options |
| `rendering-resource-hints` / script defer patterns for Next | Extension pages own their HTML entry |
| `rendering-activity` | Only if React version exposes Activity and a show/hide case needs it |
| Next-only APIs (`next/dynamic`, App Router layouts) | Use React 18 client APIs |

## Structure checklist (repo-specific)

When editing `src/popup/App.tsx` or `src/options/App.tsx`:

- [ ] Could this be a child under `components/` or a hook?
- [ ] Does it belong next to an existing panel (`EditorPanel`, modals)?
- [ ] Would lazy-loading keep the popup bundle smaller?
- [ ] Are you only changing what the task needs (no drive-by rewrite)?
