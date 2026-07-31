# Extension mismatches vs upstream React best-practices

Code-Injector’s React UI is **client-only browser-extension pages**
(`src/popup`, `src/options`), not a Next.js App Router / RSC fullstack app.

Pinned upstream: `7c180d9044c9ae2b442b567aad4e42a28dd5ed62`
([vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)).

Most retained rules under [`rules/`](rules/) are still **verbatim**. A small set
was **reworded on disk** to React built-ins / extension APIs. Adapted files
start with:

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

Matching `.cursor/rules/react-bp-*.mdc` bodies stay in sync (wrappers keep
Cursor frontmatter).

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

## Removed — non-trivial / cannot map

Could not be trivially mapped to React built-ins or extension APIs without
inventing fakes or adding deps. Deleted from `rules/` and
`.cursor/rules/react-bp-*.mdc`. **User decision: do not add SWR; do not mimic
Next/`Activity`.**

| Rule basename | Why removed | Revisit? |
|---------------|-------------|----------|
| `client-swr-dedup` | Requires SWR (or inventing a fake SWR layer). State is `browser.storage` + `onChanged` + local React state; popup lifetime is short. | If request fan-out appears, prefer a shared promise/module cache or storage subscription — still not SWR unless product chooses it. |
| `rendering-activity` | Needs React `<Activity>` (React 19+). Runtime is React 18.3. Staying mounted (`OptionsPanel` `mounted`) is an app pattern, not a substitute rule for Activity. | **Revisit on React 19+** — restore upstream rule then if Activity is available. |

---

## Removed — focus (rendering / js / advanced)

Entire upstream categories **Rendering**, **JavaScript**, and **Advanced** were
deleted so agents focus on async, bundle, client, and re-render guidance for
this extension. Includes former on-disk adaptations `js-cache-storage` and
`js-request-idle-callback`. Do not reintroduce unless product needs them.

| Prefix | Count removed (this pass) | Examples |
|--------|---------------------------|----------|
| `rendering-` | 6 | `rendering-conditional-render`, `rendering-hoist-jsx`, … |
| `js-` | 14 | `js-cache-storage`, `js-request-idle-callback`, `js-early-exit`, … |
| `advanced-` | 4 | `advanced-use-latest`, `advanced-init-once`, … |

---

## Reworded on disk

Approved adaptations — rule bodies (and matching `.mdc` wrappers) updated.

| Rule | Adaptation |
|------|------------|
| `bundle-dynamic-imports` | `next/dynamic` → `React.lazy` + `Suspense`; cites `OptionsPanel` |
| `bundle-preload` | Bare dynamic `import()` / idle warm; dropped SSR `typeof window` framing |
| `bundle-conditional` | Load-on-feature-activation + mount-on-first-open; dropped Next/SSR helpers |
| `async-suspense-boundaries` | Suspense for `lazy()` only; storage waterfalls → parallel / defer-await; removed RSC / `use(promise)` streaming |
| `async-dependencies` | Kept Promise orchestration; stripped `better-all` as recommended dep |
| `client-localstorage-schema` | Primary API `browser.storage`; theme `localStorage` mirror (`THEME_CACHE_KEY` / theme-boot) as sync exception |
| `client-event-listeners` | Dropped `useSWRSubscription` / SWR; module-level shared subscriber for `window`/`document` (and same idea for `browser.storage.onChanged` / `browser.runtime.onMessage`) |

---

## Keep the user in the loop

No further pending adapt-carefully decisions for the prior recommendation set.
Open items are only future revisits:

| Item | Status | One-line recommendation |
|------|--------|-------------------------|
| `client-swr-dedup` | **Removed** (handled) | Do not add SWR; dedupe with shared promises / storage subscription if fan-out appears |
| `rendering-activity` | **Removed** (handled) | Revisit on React 19+; until then keep expensive panels mounted after first open |
| All seven reworded rules above | **Done on disk** | Treat as approved project conventions in `SKILL.md` |
| `rendering-*` / `js-*` / `advanced-*` | **Removed** (focus) | Do not restore whole categories; prefer async/bundle/client/rerender |

---

## Apply as-is

Pure client React / JS patterns that fit the extension popup/options UI
(still verbatim upstream).

### Async

- `async-parallel.md`
- `async-defer-await.md`
- `async-cheap-condition-before-await.md`

### Bundle

- `bundle-barrel-imports.md`
- `bundle-analyzable-paths.md`

### Client

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
