---
title: Deduplicate Global Event Listeners
impact: LOW
impactDescription: single listener for N components
tags: client, event-listeners, subscription, browser-extension
---

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

## Deduplicate Global Event Listeners

Share one listener (or one extension sub) across instances — not N listeners in N `useEffect`s.

**Incorrect (N instances = N listeners):**

```tsx
function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === key) {
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback])
}
```

**Correct (N instances = 1 listener):**

```tsx
// Module-level Map + one shared window listener
const keyCallbacks = new Map<string, Set<() => void>>()
let listening = false

function onKeyDown(e: KeyboardEvent) {
  if (!e.metaKey || !keyCallbacks.has(e.key)) return
  keyCallbacks.get(e.key)!.forEach((cb) => cb())
}

function ensureKeydownListener() {
  if (listening) return
  listening = true
  window.addEventListener('keydown', onKeyDown)
}

function teardownKeydownListenerIfIdle() {
  if (keyCallbacks.size > 0) return
  window.removeEventListener('keydown', onKeyDown)
  listening = false
}

function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    if (!keyCallbacks.has(key)) {
      keyCallbacks.set(key, new Set())
    }
    keyCallbacks.get(key)!.add(callback)
    ensureKeydownListener()

    return () => {
      const set = keyCallbacks.get(key)
      if (set) {
        set.delete(callback)
        if (set.size === 0) {
          keyCallbacks.delete(key)
        }
      }
      teardownKeydownListenerIfIdle()
    }
  }, [key, callback])
}

function EditorChrome() {
  // Multiple shortcuts share the same keydown listener
  useKeyboardShortcut('p', () => { /* ... */ })
  useKeyboardShortcut('k', () => { /* ... */ })
}
```

**Same for extension APIs** (`browser.storage.onChanged`, `browser.runtime.onMessage`): module-level `Set` + one `addListener` while subscribers exist. No per-component `addListener` in `useEffect`.
