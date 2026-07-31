---
name: react-best-practices
description: >-
  React perf for Code-Injector popup/options UI. Vercel rules adapted for
  extension. Use when writing/reviewing/refactoring React under src/popup or
  src/options; App.tsx; lazy panels; storage/async; re-renders; bundle size.
---

# React Best Practices (Code-Injector)

**Sole source:** [`rules/`](rules/). Upstream [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices/rules) @ [`7c180d9`](https://github.com/vercel-labs/agent-skills/commit/7c180d9044c9ae2b442b567aad4e42a28dd5ed62) (MIT, [@shuding](https://x.com/shuding)/Vercel).

Most rules verbatim. Adapted files note “Adapted for Code Injector Reborn” — see [`MISMATCHES.md`](MISMATCHES.md).

Companion: `.cursor/rules/react-best-practices.mdc` (glob trigger only; no rule restatement).

## Excluded upstream (N/A)

Client-only extension pages — no Next server/RSC/SSR/API routes. Removed from `rules/`:

- `async-api-routes`, all `server-*` (10)
- `rendering-hydration-*`, `rendering-resource-hints`, `rendering-script-defer-async`
- `bundle-defer-third-party` (hydration), `client-swr-dedup` (no SWR)
- `rendering-activity` (needs React 19+; revisit on upgrade)
- all `rendering-*`, `js-*`, `advanced-*` — focus cut

Detail: [`MISMATCHES.md`](MISMATCHES.md).

## Project adaptations

| Rule | Convention |
|------|------------|
| `bundle-dynamic-imports` | `React.lazy` + `Suspense` — never `next/dynamic` |
| `bundle-preload` | Bare `import()` / idle warm; no SSR framing |
| `bundle-conditional` | Load-on-activation; mount-on-first-open (`OptionsPanel`) |
| `async-suspense-boundaries` | Suspense for `lazy()` only; storage → parallel / defer-await |
| `async-dependencies` | Promise orchestration; **no** `better-all` |
| `client-localstorage-schema` | Version/minimize `browser.storage`; `localStorage` = theme mirror only |
| `client-event-listeners` | Module-level shared listener; never SWR |

## When / how

Touch `src/popup/**`, `src/options/**`, async `browser.*`/storage, Monaco/panels, or review re-renders/waterfalls/bundle → apply.

1. Open matching [`rules/`](rules/) file; follow Incorrect/Correct.
2. Order/impact: [`rules/_sections.md`](rules/_sections.md).
3. Check [`MISMATCHES.md`](MISMATCHES.md) before insisting. No Next/SWR/RSC APIs.
4. Prefer extract under `components/` vs growing `App.tsx` (`EditorPanel`, `RuleItem`, …).

## Categories (retained)

| Pri | Category | Prefix |
|-----|----------|--------|
| 1 | Eliminating Waterfalls | `async-` |
| 2 | Bundle Size | `bundle-` |
| 3 | Client-Side Data | `client-` |
| 4 | Re-render | `rerender-` |

Index: [reference.md](reference.md).
