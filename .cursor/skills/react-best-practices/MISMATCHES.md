# Extension mismatches vs upstream

Client-only (`src/popup`, `src/options`). Upstream @ `7c180d9`. Adapted files start with: *Adapted for Code Injector Reborn…*. Trigger: `.cursor/rules/react-best-practices.mdc`. Bodies only in [`rules/`](rules/).

## Removed — N/A

| Rule | Why |
|------|-----|
| `async-api-routes` | Next API / server actions |
| `server-after-nonblocking` | Next `after()` |
| `server-auth-actions` | Server Actions auth |
| `server-cache-lru` | Server LRU |
| `server-cache-react` | `React.cache()` RSC |
| `server-dedup-props` | RSC prop serialization |
| `server-hoist-static-io` | Server route / OG / font I/O |
| `server-no-shared-module-state` | RSC/SSR module state |
| `server-parallel-fetching` | Server fetch parallel |
| `server-parallel-nested-fetching` | Nested server fetch |
| `server-serialization` | RSC → client serialize |
| `rendering-hydration-no-flicker` | SSR hydration |
| `rendering-hydration-suppress-warning` | SSR warn suppress |
| `rendering-resource-hints` | ReactDOM preload/preconnect |
| `rendering-script-defer-async` | Document `<script defer/async>` |
| `bundle-defer-third-party` | Defer after **hydration** |

## Removed — cannot map

| Rule | Why | Revisit |
|------|-----|---------|
| `client-swr-dedup` | Needs SWR; state = `browser.storage` + `onChanged` | Shared promise/storage sub — not SWR |
| `rendering-activity` | Needs React 19 `<Activity>`; runtime 18.3 | Restore on React 19+ |

## Removed — focus

| Prefix | Count | Examples |
|--------|-------|----------|
| `rendering-` | 6 | `rendering-conditional-render`, … |
| `js-` | 14 | `js-cache-storage`, `js-early-exit`, … |
| `advanced-` | 4 | `advanced-use-latest`, … |

Includes former adaptations `js-cache-storage`, `js-request-idle-callback`. Do not restore whole categories.

## Reworded on disk

| Rule | Adaptation |
|------|------------|
| `bundle-dynamic-imports` | `next/dynamic` → `React.lazy` + `Suspense`; cites `OptionsPanel` |
| `bundle-preload` | Bare `import()` / idle warm; no SSR `typeof window` |
| `bundle-conditional` | Load-on-activation + mount-on-first-open |
| `async-suspense-boundaries` | Suspense for `lazy()` only; storage → parallel / defer-await |
| `async-dependencies` | Promise orchestration; no `better-all` |
| `client-localstorage-schema` | Primary `browser.storage`; theme `localStorage` mirror (`THEME_CACHE_KEY`) |
| `client-event-listeners` | Module-level shared sub for `window`/`document` / `browser.*.addListener` |

## Open / apply-as-is

| Item | Status |
|------|--------|
| `client-swr-dedup` | Removed — no SWR |
| `rendering-activity` | Removed — revisit React 19+ |
| Seven reworded above | Done — project convention |
| `rendering-*` / `js-*` / `advanced-*` | Removed — focus |

**Apply-as-is (verbatim):** `async-parallel`, `async-defer-await`, `async-cheap-condition-before-await`, `bundle-barrel-imports`, `bundle-analyzable-paths`, `client-passive-event-listeners`, all `rerender-*`.
