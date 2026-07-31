# react-best-practices (Code-Injector)

Vercel’s React Best Practices rules for agents working on this extension’s
popup/options React UI. Next/RSC/SSR-only rules are **removed**. Rendering,
JavaScript, and Advanced categories were also **dropped for focus**. A small
set of retained rules is **adapted** for the browser extension (React built-ins /
`browser.storage` instead of Next.js / SWR / RSC); the rest stay **verbatim**.

**Attribution:** Upstream from
[`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills)
(MIT), originally created by [@shuding](https://x.com/shuding) at
[Vercel](https://vercel.com).

**Pinned upstream commit:**
[`7c180d9044c9ae2b442b567aad4e42a28dd5ed62`](https://github.com/vercel-labs/agent-skills/commit/7c180d9044c9ae2b442b567aad4e42a28dd5ed62)

Upstream source:
https://github.com/vercel-labs/agent-skills/tree/7c180d9044c9ae2b442b567aad4e42a28dd5ed62/skills/react-best-practices/rules

| File / path | Role |
|-------------|------|
| [SKILL.md](SKILL.md) | Thin orchestrator — overview, exclusions, adaptations |
| [`.cursor/rules/react-bp-*.mdc`](../../rules/) | **Canonical** per-rule content (restrictive globs) |
| [reference.md](reference.md) | Index + section metadata |
| [MISMATCHES.md](MISMATCHES.md) | Removed / reworded / apply-as-is records |

Each `react-bp-*.mdc` has `alwaysApply: false` and globs scoped to
`src/popup/**/*.{tsx,ts}` and `src/options/**/*.{tsx,ts}`. There is no
umbrella `react-best-practices.mdc` — Cursor loads individual rules by glob /
description. This skill remains invokable for overview and MISMATCHES.

N/A and focus-dropped upstream rules are not present as `.mdc` files — see
[MISMATCHES.md](MISMATCHES.md) and [SKILL.md](SKILL.md).
