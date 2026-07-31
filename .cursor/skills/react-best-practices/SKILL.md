---
name: react-best-practices
description: >-
  React performance and structure guidance for Code-Injector's browser-extension
  UI (popup + options), adapted from Vercel Engineering's React Best Practices.
  Use when writing, reviewing, or refactoring React under src/popup or
  src/options; when editing App.tsx god-components; when adding lazy-loaded
  panels, storage/async flows, or optimizing re-renders and bundle size.
---

# React Best Practices (Code-Injector)

Authority (full upstream catalog):  
https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices

Originally by [@shuding](https://x.com/shuding) / [Vercel](https://vercel.com) (`vercel-labs/agent-skills`). This skill **distills** that guide for a **React 18 browser-extension** popup/options UI — **not** Next.js App Router / RSC.

## When to use

Apply this skill when you:

- Add or change UI in `src/popup/**` or `src/options/**`
- Touch `src/popup/App.tsx` (~1000+ lines) or `src/options/App.tsx` (~400 lines)
- Introduce async `browser.*` / storage work, heavy editors (Monaco), or new panels
- Review React for re-renders, waterfalls, or bundle size

## Repo pain point: split, don't grow

Prefer extracting focused components/hooks from the App roots rather than growing them further when you touch that code.

| Do | Don't |
|----|--------|
| New panel/section → `src/popup/components/` or `src/options/components/` | Add another large JSX block to `App.tsx` |
| Shared logic → custom hook colocated near usage | Inline more `useCallback`/effects into App |
| Heavy optional UI → `React.lazy` + `Suspense` (see `OptionsPanel`) | Eager-import Monaco/options into the critical path |

Match existing file layout and naming (`EditorPanel`, `RuleItem`, `ImportModal`, etc.). Do not drive-by refactor unrelated regions.

## Priority map for this codebase

| Priority | Upstream category | Extension relevance |
|----------|-------------------|---------------------|
| 1 | Eliminating waterfalls (`async-*`) | **Apply** to `browser.storage`, messaging, tab APIs — parallelize independent awaits |
| 2 | Bundle size (`bundle-*`) | **Apply** with `React.lazy` (not `next/dynamic`). Keep popup critical path small |
| 3 | Server-side (`server-*`) | **N/A** — no RSC/SSR/server actions |
| 4 | Client data (`client-*`) | **Partial** — event-listener hygiene; storage versioning; SWR optional (not required) |
| 5 | Re-render (`rerender-*`) | **Apply** — see [reference.md](reference.md) |
| 6 | Rendering (`rendering-*`) | **Partial** — lists, conditionals; hydration/resource-hints mostly N/A |
| 7 | JS (`js-*`) | **Apply** on hot paths (rules list, pattern matching) |
| 8 | Advanced (`advanced-*`) | **Optional** — `useEffectEvent` / refs when already fitting the change |

## Non-negotiables (short)

1. **Composition over App growth** — extract before the next feature lands in App.
2. **No inline components** — never define components inside components (`rerender-no-inline-components`).
3. **Derive in render** — don't sync derived values through effects (`rerender-derived-state-no-effect`).
4. **Parallelize independent async** — `Promise.all` for independent storage/API reads (`async-parallel`).
5. **Lazy-load heavy UI** — follow `OptionsPanel`'s `lazy` + mount-once pattern for optional surfaces.
6. **Memo discipline** — do **not** add `useMemo`/`useCallback` by default. This repo already uses `useCallback` in App; only add more when matching that local pattern or fixing a measured issue. Prefer structural splits that reduce subscription surface.
7. **Import directly** — avoid barrel re-exports that pull Monaco or large graphs (`bundle-barrel-imports`).

## Extension-specific notes

- Popup/options are **client-only** document pages. Skip Next.js/`server-*`/RSC rules unless something clearly maps (it usually doesn't).
- Prefer `React.lazy(() => import(...))` over `next/dynamic`.
- Storage is `browser.storage` (see `src/shared/storage.ts`), not localStorage — still version and minimize persisted shapes (`client-localstorage-schema` spirit).
- Keep popup open snappy: defer Monaco/`ensureEditors` and options chunk until needed.

## Workflow

1. Read this skill; for rule-level detail open [reference.md](reference.md).
2. For full examples, fetch upstream `AGENTS.md` or individual `rules/*.md` from the GitHub URL above — do not copy the whole upstream tree into this repo.
3. When changing App roots: extract the touched concern first if the change would otherwise enlarge App.
4. Preserve established patterns (SCSS classnames, `data-name` hooks for tests, shared types in `src/shared`).

## Attribution

Adapted from [vercel-labs/agent-skills — react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) (MIT), originally created by [@shuding](https://x.com/shuding) at Vercel. Not a verbatim mirror; server-only guidance is marked N/A for this extension.
