---
title: Conditional Module Loading
impact: HIGH
impactDescription: loads large modules only when needed
tags: bundle, conditional-loading, lazy-loading
---

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

## Conditional Module Loading

Load large modules only when a feature is activated (mount-on-open / lazy on
first use). Prefer `React.lazy` + keep-mounted-after-first-open over eager
static imports for Monaco/options-scale UI.

**Example (load on feature activation):**

```tsx
function AnimationPlayer({ enabled, setEnabled }: { enabled: boolean; setEnabled: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (enabled && !frames) {
      import('./animation-frames.js')
        .then(mod => setFrames(mod.frames))
        .catch(() => setEnabled(false))
    }
  }, [enabled, frames, setEnabled])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

**Example (mount-on-first-open, keep mounted):**

```tsx
const OptionsApp = lazy(() =>
  import('../../options/App').then((mod) => ({ default: mod.App }))
)

function OptionsPanel({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (active) setMounted(true)
  }, [active])

  return (
    <>
      {mounted && (
        <Suspense fallback={<div className="options-loading" />}>
          <OptionsApp embedded active={active} />
        </Suspense>
      )}
    </>
  )
}
```

Project pattern: `src/popup/components/OptionsPanel.tsx`.
