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

Companion Cursor rules: one `.cursor/rules/react-bp-*.mdc` per upstream practice
rule (glob-scoped to `src/popup` and `src/options`), each embedding the same
verbatim markdown.

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
3. This repo is a **browser-extension** React UI (popup/options), not Next.js /
   RSC. Before insisting on a rule, check [`MISMATCHES.md`](MISMATCHES.md) for
   N/A vs adapt-carefully vs apply-as-is. **Do not edit rule files to “fit”** —
   only skip or adapt usage per that flag list.
4. Repo structure preference (not from upstream): when touching App roots, prefer
   extracting focused components/hooks under `components/` rather than growing
   `App.tsx` further. Match existing naming (`EditorPanel`, `RuleItem`, etc.).

## Rule categories (upstream priority)

| Priority | Category | Prefix |
|----------|----------|--------|
| 1 | Eliminating Waterfalls | `async-` |
| 2 | Bundle Size Optimization | `bundle-` |
| 3 | Server-Side Performance | `server-` |
| 4 | Client-Side Data Fetching | `client-` |
| 5 | Re-render Optimization | `rerender-` |
| 6 | Rendering Performance | `rendering-` |
| 7 | JavaScript Performance | `js-` |
| 8 | Advanced Patterns | `advanced-` |

Full index and extension applicability: [reference.md](reference.md), [MISMATCHES.md](MISMATCHES.md).

## Attribution

Verbatim rules from
[vercel-labs/agent-skills — react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
(MIT), originally created by [@shuding](https://x.com/shuding) at Vercel.
Pinned upstream commit: `7c180d9044c9ae2b442b567aad4e42a28dd5ed62`.
