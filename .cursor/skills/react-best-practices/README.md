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

Source directory:
https://github.com/vercel-labs/agent-skills/tree/7c180d9044c9ae2b442b567aad4e42a28dd5ed62/skills/react-best-practices/rules

| File / path | Role |
|-------------|------|
| [SKILL.md](SKILL.md) | Agent entrypoint — points at `rules/` + approved adaptations |
| [rules/](rules/) | Rule markdown (verbatim unless marked Adapted) |
| [reference.md](reference.md) | Index of retained rule files (titles only) |
| [MISMATCHES.md](MISMATCHES.md) | Removed / reworded / apply-as-is records |

Companion Cursor rules (glob-scoped to `src/popup` / `src/options`):

- `.cursor/rules/react-bp-*.mdc` — one file per **retained** practice rule;
  **glob triggers only** (frontmatter + pointer to `rules/<name>.md`). Skill
  `rules/` is the sole source of truth; do not duplicate rule bodies in `.mdc`.

N/A, non-mappable, and focus-dropped upstream rules are not present under
`rules/` or `.cursor/rules/` — see [MISMATCHES.md](MISMATCHES.md) and
[SKILL.md](SKILL.md).
