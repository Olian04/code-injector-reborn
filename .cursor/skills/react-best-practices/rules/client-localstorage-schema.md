---
title: Version and Minimize Extension Storage Data
impact: MEDIUM
impactDescription: prevents schema conflicts, reduces storage size
tags: client, browser-storage, localStorage, storage, versioning, data-minimization
---

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

## Version and Minimize Extension Storage Data

Primary persist: `browser.storage.local` (`src/shared/storage.ts`) — **not** `localStorage`. Version keys/shapes; store needed fields; migrate deliberately.

**Incorrect:**

```typescript
// Dump the whole object into storage with no shape discipline
await browser.storage.local.set({ userConfig: fullUserObject })
const data = await browser.storage.local.get('userConfig')
```

**Correct:**

```typescript
const VERSION = 'v2'
const KEY = `userConfig:${VERSION}`

async function saveConfig(config: { theme: string; language: string }) {
  await browser.storage.local.set({ [KEY]: config })
}

async function loadConfig() {
  const data = await browser.storage.local.get(KEY)
  return (data[KEY] as { theme: string; language: string } | undefined) ?? null
}

// Migration from v1 to v2
async function migrate() {
  const data = await browser.storage.local.get('userConfig:v1')
  const v1 = data['userConfig:v1'] as { darkMode?: boolean; lang?: string } | undefined
  if (v1) {
    await saveConfig({
      theme: v1.darkMode ? 'dark' : 'light',
      language: v1.lang ?? 'en',
    })
    await browser.storage.local.remove('userConfig:v1')
  }
}
```

**Sync exception — theme first paint:** `localStorage` only for theme mirror (`THEME_CACHE_KEY` / `public/theme-boot.js`). Keep try/catch (`applyTheme`). Do **not** put rules/settings in `localStorage`.

**Store minimal fields:**

```typescript
// Prefer a small settings shape over caching entire rule payloads twice
await browser.storage.local.set({
  'prefs:v1': {
    theme: settings.theme,
    notifications: settings.notifications,
  },
})
```
