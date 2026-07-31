---
title: Cache Storage API Calls
impact: LOW-MEDIUM
impactDescription: reduces expensive I/O
tags: javascript, browser-storage, localStorage, storage, caching, performance
---

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

## Cache Storage API Calls

Hot storage reads benefit from a module-level `Map` cache. Most extension data
is async `browser.storage`; sync `localStorage` is only the theme boot mirror
(`THEME_CACHE_KEY`). Popup sessions are short — do **not** cache every
`getSettings()` call by default.

**Incorrect (reads storage on every call):**

```typescript
function getThemeCache() {
  return localStorage.getItem(THEME_CACHE_KEY) ?? 'light'
}
// Called 10 times = 10 storage reads
```

**Correct (Map cache for sync theme mirror):**

```typescript
const storageCache = new Map<string, string | null>()

function getThemeCache() {
  if (!storageCache.has(THEME_CACHE_KEY)) {
    storageCache.set(THEME_CACHE_KEY, localStorage.getItem(THEME_CACHE_KEY))
  }
  return storageCache.get(THEME_CACHE_KEY) ?? 'light'
}

function setThemeCache(value: string) {
  localStorage.setItem(THEME_CACHE_KEY, value)
  storageCache.set(THEME_CACHE_KEY, value)
}
```

**Optional session cache for hot `browser.storage` keys:**

```typescript
const browserStorageCache = new Map<string, unknown>()

async function getCachedSetting(key: string) {
  if (browserStorageCache.has(key)) {
    return browserStorageCache.get(key)
  }
  const data = await browser.storage.local.get(key)
  browserStorageCache.set(key, data[key])
  return data[key]
}
```

Use a Map (not a hook) so it works in utilities and event handlers, not only
React components.

**Important (invalidate on external changes):**

Cross-context updates use `browser.storage.onChanged` (not the `window`
`storage` event for extension storage):

```typescript
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return
  for (const key of Object.keys(changes)) {
    browserStorageCache.delete(key)
  }
})
```

For the theme `localStorage` mirror, invalidate the Map entry when `applyTheme`
writes, or on `visibilitychange` if another context may have updated it.
