---
name: react-best-practices
description: >-
  React performance guidance for Code-Injector's browser-extension UI
  (popup + options), using Vercel Engineering React Best Practices rules
  adapted where needed for the extension. Use when writing, reviewing, or
  refactoring React under src/popup or src/options; when editing App.tsx;
  when adding lazy-loaded panels, storage/async flows, or optimizing
  re-renders and bundle size.
---

# React Best Practices (Code-Injector)

**Sole rule source:** the files in [`rules/`](rules/) — based on
[vercel-labs/agent-skills — react-best-practices/rules](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices/rules)
at commit [`7c180d9044c9ae2b442b567aad4e42a28dd5ed62`](https://github.com/vercel-labs/agent-skills/commit/7c180d9044c9ae2b442b567aad4e42a28dd5ed62).

Originally by [@shuding](https://x.com/shuding) / [Vercel](https://vercel.com).

Most retained rules are still **verbatim** upstream. A small set is **adapted
on disk** for this browser-extension UI (React built-ins / `browser.storage`
instead of Next.js / SWR / RSC). Adapted files carry an “Adapted for Code
Injector Reborn” note at the top. See [`MISMATCHES.md`](MISMATCHES.md).

Companion Cursor rules: one `.cursor/rules/react-bp-*.mdc` per retained practice
rule (glob-scoped to `src/popup` and `src/options`), each embedding the same
rule markdown body (wrappers keep Cursor frontmatter).

## Excluded upstream rules (N/A for this project)

This UI is **client-only browser-extension pages** (`src/popup`, `src/options`) —
no Next.js server, RSC, SSR hydration, API routes, or document-level Next
resource pipeline. The following upstream rules were **removed** from `rules/`
and from `.cursor/rules/react-bp-*.mdc` (do not reintroduce or apply them):

- `async-api-routes` — Next.js API routes / server actions waterfalls
- all `server-*` rules (10) — RSC/SSR/server-actions/server I/O
- `rendering-hydration-no-flicker` / `rendering-hydration-suppress-warning` — SSR hydration
- `rendering-resource-hints` / `rendering-script-defer-async` — document-level web resource loading
- `bundle-defer-third-party` — defer after **hydration**
- `client-swr-dedup` — SWR; do not add SWR for this UI
- `rendering-activity` — React `<Activity>` (needs React 19+); revisit on upgrade
- all `rendering-*`, `js-*`, and `advanced-*` rules — dropped to focus on
  extension-relevant async / bundle / client / rerender guidance

Rationale, reworded rules, and apply-as-is lists: [`MISMATCHES.md`](MISMATCHES.md).

## Project adaptations

**Approved conventions** (rewritten on disk under `rules/` and matching
`.cursor/rules/react-bp-*.mdc`):

| Rule | Convention |
|------|------------|
| `bundle-dynamic-imports` | `React.lazy` + `Suspense` (see `OptionsPanel`) — never `next/dynamic` |
| `bundle-preload` | Bare `import()` / idle warm; no SSR `typeof window` framing |
| `bundle-conditional` | Load-on-feature-activation; mount-on-first-open like `OptionsPanel` |
| `async-suspense-boundaries` | Suspense for `lazy()` only; storage waterfalls → parallel / defer-await |
| `async-dependencies` | Promise orchestration only; do **not** add `better-all` |
| `client-localstorage-schema` | Version/minimize `browser.storage`; `localStorage` = theme mirror only |
| `client-event-listeners` | Module-level shared `window`/`document` listener (or one `browser.*.addListener`); never SWR |

Removed rather than faked: `client-swr-dedup`, `rendering-activity` (see
MISMATCHES “Removed — non-trivial / cannot map”). Rendering / JS / Advanced
categories were later dropped entirely for focus (including former adaptations
`js-cache-storage` and `js-request-idle-callback`).

## When to use

Apply this skill when you:

- Add or change UI in `src/popup/**` or `src/options/**`
- Touch `src/popup/App.tsx` or `src/options/App.tsx`
- Introduce async `browser.*` / storage work, heavy editors (Monaco), or new panels
- Review React for re-renders, waterfalls, or bundle size

## How to apply

1. Open the matching file under [`rules/`](rules/) (or the corresponding
   `react-bp-*.mdc`) and follow its incorrect/correct guidance.
2. Section ordering and impact levels: [`rules/_sections.md`](rules/_sections.md).
3. Before insisting on a rule, check [`MISMATCHES.md`](MISMATCHES.md) for
   removed vs reworded vs apply-as-is. Do not reintroduce Next.js / SWR / RSC APIs.
4. Repo structure preference (not from upstream): when touching App roots, prefer
   extracting focused components/hooks under `components/` rather than growing
   `App.tsx` further. Match existing naming (`EditorPanel`, `RuleItem`, etc.).

## Rule categories (retained)

| Priority | Category | Prefix |
|----------|----------|--------|
| 1 | Eliminating Waterfalls | `async-` |
| 2 | Bundle Size Optimization | `bundle-` |
| 3 | Client-Side Data Fetching | `client-` |
| 4 | Re-render Optimization | `rerender-` |

Upstream priority 3 (`server-`) and priorities 5–7 (`rendering-`, `js-`,
`advanced-`) are omitted — removed as N/A or to focus agents on
extension-relevant guidance.

Full index and extension applicability: [reference.md](reference.md), [MISMATCHES.md](MISMATCHES.md).

## Attribution

Rules from
[vercel-labs/agent-skills — react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
(MIT), originally created by [@shuding](https://x.com/shuding) at Vercel.
Pinned upstream commit: `7c180d9044c9ae2b442b567aad4e42a28dd5ed62`.
Some rules adapted for Code Injector Reborn (browser extension); see
[`MISMATCHES.md`](MISMATCHES.md).
