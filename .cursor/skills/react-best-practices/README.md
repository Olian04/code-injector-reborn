# react-best-practices (Code-Injector)

Verbatim copy of Vercel’s React Best Practices rules for agents working on this
extension’s popup/options React UI, with Next/RSC/SSR-only rules **removed**.

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
| [SKILL.md](SKILL.md) | Agent entrypoint — points at retained verbatim `rules/` |
| [rules/](rules/) | **Verbatim** upstream rule markdown (authority for kept rules) |
| [reference.md](reference.md) | Index of retained rule files (titles only) |
| [MISMATCHES.md](MISMATCHES.md) | Removed N/A rules + adapt-carefully / apply-as-is flags |

Companion Cursor rules (glob-scoped to `src/popup` / `src/options`):

- `.cursor/rules/react-bp-*.mdc` — one file per **retained** practice rule; Cursor
  frontmatter plus the full verbatim upstream markdown body

N/A upstream rules (all `server-*`, API-route waterfalls, SSR hydration,
document resource hints/scripts, hydration-tied third-party deferral) are not
present under `rules/` or `.cursor/rules/` — see [MISMATCHES.md](MISMATCHES.md)
and the exclusion note in [SKILL.md](SKILL.md).
