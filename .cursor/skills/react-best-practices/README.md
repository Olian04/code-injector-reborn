# react-best-practices (Code-Injector)

Verbatim copy of Vercel’s React Best Practices rules for agents working on this
extension’s popup/options React UI.

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
| [SKILL.md](SKILL.md) | Agent entrypoint — points at verbatim `rules/` |
| [rules/](rules/) | **Verbatim** upstream rule markdown (authority) |
| [reference.md](reference.md) | Index of rule files (titles only) |
| [MISMATCHES.md](MISMATCHES.md) | Extension vs Next/fullstack applicability flags |

Companion Cursor rules (glob-scoped to `src/popup` / `src/options`):

- `.cursor/rules/react-bp-*.mdc` — one file per practice rule; Cursor frontmatter
  plus the full verbatim upstream markdown body
