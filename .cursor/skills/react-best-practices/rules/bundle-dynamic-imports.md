---
title: Dynamic Imports for Heavy Components
impact: CRITICAL
impactDescription: directly affects TTI and LCP
tags: bundle, dynamic-import, code-splitting, react-lazy
---

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

## Dynamic Imports for Heavy Components

`React.lazy` + `Suspense` for heavy components not needed on first paint. Never `next/dynamic`.

**Incorrect (Monaco / options UI bundles with main chunk):**

```tsx
import { MonacoEditor } from './monaco-editor'

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

**Correct (heavy UI loads on demand):**

```tsx
import { lazy, Suspense } from 'react'

const MonacoEditor = lazy(() =>
  import('./monaco-editor').then((m) => ({ default: m.MonacoEditor }))
)

function CodePanel({ code }: { code: string }) {
  return (
    <Suspense fallback={<div className="loading" />}>
      <MonacoEditor value={code} />
    </Suspense>
  )
}
```

Pattern: `src/popup/components/OptionsPanel.tsx` — lazy options app; keep mounted after first open.
