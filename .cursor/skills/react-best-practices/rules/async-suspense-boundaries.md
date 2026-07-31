---
title: Strategic Suspense Boundaries
impact: HIGH
impactDescription: faster initial paint for lazy UI
tags: async, suspense, lazy, code-splitting
---

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

## Strategic Suspense Boundaries

`Suspense` = `React.lazy` code-split so shell paints while chunk loads. No RSC streaming; no `use(promise)` data convention.

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

**Storage / messaging waterfalls:** not Suspense data boundaries. Prefer `async-parallel` / `async-defer-await`.

**Skip Suspense:** critical UI before user can act; tiny modules; `browser.storage` reads → effects / parallel promises.
