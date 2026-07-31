---
title: Check Cheap Conditions Before Async Flags
impact: HIGH
impactDescription: avoids unnecessary async work when a synchronous guard already fails
tags: async, await, feature-flags, short-circuit, conditional
---

## Check Cheap Conditions Before Async Flags

Branch needs `await` flag **and** cheap sync guard → check cheap first. Else pay async even when compound never true. Specialization of [Defer Await Until Needed](./async-defer-await.md).

**Incorrect:**

```typescript
const someFlag = await getFlag()

if (someFlag && someCondition) {
  // ...
}
```

**Correct:**

```typescript
if (someCondition) {
  const someFlag = await getFlag()
  if (someFlag) {
    // ...
  }
}
```

Matters when `getFlag` = network / flag service / DB. Keep original order if `someCondition` expensive, depends on flag, or side-effect order fixed.
