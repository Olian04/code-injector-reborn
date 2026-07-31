---
title: Preload Based on User Intent
impact: MEDIUM
impactDescription: reduces perceived latency
tags: bundle, preload, user-intent, hover, idle
---

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

## Preload Based on User Intent

Preload heavy bundles before need. Bare `import()` or idle warm helper — no Next preload API / SSR.

**Example (preload on hover/focus):**

```tsx
function EditorButton({ onClick }: { onClick: () => void }) {
  const preload = () => {
    void import('./monaco-editor')
  }

  return (
    <button
      onMouseEnter={preload}
      onFocus={preload}
      onClick={onClick}
    >
      Open Editor
    </button>
  )
}
```

**Example (idle warm when the popup opens):**

```tsx
useEffect(() => {
  const warm = () => {
    void ensureEditors() // starts dynamic import of Monaco
  }

  const idle = window.requestIdleCallback
    ? window.requestIdleCallback(warm, { timeout: 1000 })
    : window.setTimeout(warm, 1)

  return () => {
    if (window.cancelIdleCallback && typeof idle === 'number') {
      window.cancelIdleCallback(idle)
    } else {
      clearTimeout(idle)
    }
  }
}, [ensureEditors])
```

Prefer idle warm for Monaco-class editors. Hover/focus if idle warm not enough (e.g. options chunk on gear hover).
