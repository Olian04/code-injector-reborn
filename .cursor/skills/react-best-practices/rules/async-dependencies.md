---
title: Dependency-Based Parallelization
impact: CRITICAL
impactDescription: 2-10× improvement
tags: async, parallelization, dependencies
---

> Adapted for Code Injector Reborn (browser extension). Upstream: vercel-labs/agent-skills @ 7c180d9.

## Dependency-Based Parallelization

Partial deps → start dependent promises early; join `Promise.all` so independent work overlaps. **No** `better-all` for short-lived popup.

**Incorrect (profile waits for config unnecessarily):**

```typescript
const [user, config] = await Promise.all([
  fetchUser(),
  fetchConfig()
])
const profile = await fetchProfile(user.id)
```

**Correct (config and profile run in parallel):**

```typescript
const userPromise = fetchUser()
const profilePromise = userPromise.then(user => fetchProfile(user.id))

const [user, config, profile] = await Promise.all([
  userPromise,
  fetchConfig(),
  profilePromise
])
```

Same for extension I/O: start `browser.storage` / messaging promises early; await join — don't serialize independent reads.
