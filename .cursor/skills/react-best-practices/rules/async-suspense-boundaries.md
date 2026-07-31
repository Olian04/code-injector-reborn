---
title: Strategic Suspense Boundaries
impact: HIGH
impactDescription: faster initial paint for lazy UI
tags: async, suspense, lazy, code-splitting
---

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

## Strategic Suspense Boundaries

In this extension, `Suspense` is for `React.lazy` code-split boundaries so the
shell paints while a heavy chunk loads. There is no RSC streaming and no
`use(promise)` data-loading convention here.

**Incorrect (eager import blocks the shell):**

```tsx
import { OptionsApp } from '../../options/App'

function OptionsPanel({ active }: { active: boolean }) {
  if (!active) return null
  return <OptionsApp embedded active={active} />
}
```

**Correct (lazy chunk + Suspense fallback):**

```tsx
import { lazy, Suspense, useEffect, useState } from 'react'

const OptionsApp = lazy(() =>
  import('../../options/App').then((mod) => ({ default: mod.App }))
)

function OptionsPanel({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (active) setMounted(true)
  }, [active])

  if (!mounted) return null

  return (
    <Suspense fallback={<div className="options-loading" />}>
      <OptionsApp embedded active={active} />
    </Suspense>
  )
}
```

**Storage / messaging waterfalls:** do **not** model them as Suspense data
boundaries. Prefer `async-parallel` and `async-defer-await` (start promises
early, `Promise.all` where independent, await only when needed).

**When NOT to wrap in Suspense:**

- Critical UI needed before the user can act (save/inject controls)
- Tiny modules where lazy overhead isn't worth it
- Async `browser.storage` reads — use effects / parallel promises instead
