---
name: react-best-practices
description: >-
  React performance guidance for Code-Injector's browser-extension UI
  (popup + options), using verbatim Vercel Engineering React Best Practices
  rules. Use when writing, reviewing, or refactoring React under src/popup or
  src/options; when editing App.tsx; when adding lazy-loaded panels,
  storage/async flows, or optimizing re-renders and bundle size.
---

# React Best Practices (Code-Injector)

**Sole rule source:** the verbatim files in [`rules/`](rules/) — copied from
[vercel-labs/agent-skills — react-best-practices/rules](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices/rules)
at commit [`7c180d9044c9ae2b442b567aad4e42a28dd5ed62`](https://github.com/vercel-labs/agent-skills/commit/7c180d9044c9ae2b442b567aad4e42a28dd5ed62).

Originally by [@shuding](https://x.com/shuding) / [Vercel](https://vercel.com).
Do **not** paraphrase, distill, or rewrite those rule bodies. Apply them as written.

Companion Cursor rules: one `.cursor/rules/react-bp-*.mdc` per retained practice
rule (glob-scoped to `src/popup` and `src/options`), each embedding the same
verbatim markdown.

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

Rationale and the adapt-carefully / apply-as-is lists for **remaining** rules:
[`MISMATCHES.md`](MISMATCHES.md).

## Project adaptations

**Pending user approval** — do not treat these as settled conventions yet.

Decided-direction drafts (upstream stays verbatim; agents map usage) live in
[`MISMATCHES.md` → Needs your attention / adapt carefully](MISMATCHES.md#needs-your-attention--adapt-carefully)
and the summary table
[`Project adaptations (pending approval)`](MISMATCHES.md#project-adaptations-pending-approval).

Until approved: follow adapt-carefully guidance in MISMATCHES when a rule’s
examples mention Next/SWR/RSC/`better-all`/`Activity`; do not rewrite `rules/`.

## When to use

Apply this skill when you:

- Add or change UI in `src/popup/**` or `src/options/**`
- Touch `src/popup/App.tsx` or `src/options/App.tsx`
- Introduce async `browser.*` / storage work, heavy editors (Monaco), or new panels
- Review React for re-renders, waterfalls, or bundle size

## How to apply

1. Open the matching file under [`rules/`](rules/) (or the corresponding
   `react-bp-*.mdc`) and follow its incorrect/correct guidance **verbatim**.
2. Section ordering and impact levels: [`rules/_sections.md`](rules/_sections.md).
3. Before insisting on a rule, check [`MISMATCHES.md`](MISMATCHES.md) for
   adapt-carefully vs apply-as-is. **Do not edit rule files to “fit”** — only
   adapt usage per that flag list. Excluded (N/A) rules are already deleted.
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
| 5 | Rendering Performance | `rendering-` |
| 6 | JavaScript Performance | `js-` |
| 7 | Advanced Patterns | `advanced-` |

Upstream priority 3 (`server-`) is omitted — all server rules were N/A and removed.

Full index and extension applicability: [reference.md](reference.md), [MISMATCHES.md](MISMATCHES.md).

## Attribution

Verbatim rules from
[vercel-labs/agent-skills — react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
(MIT), originally created by [@shuding](https://x.com/shuding) at Vercel.
Pinned upstream commit: `7c180d9044c9ae2b442b567aad4e42a28dd5ed62`.
