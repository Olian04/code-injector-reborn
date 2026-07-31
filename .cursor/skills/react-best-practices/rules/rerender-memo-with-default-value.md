---
title: Extract Default Non-primitive Parameter Value from Memoized Component to Constant
impact: MEDIUM
impactDescription: restores memoization by using a constant for default value
tags: rerender, memo, optimization
---

## Extract Default Non-primitive Parameter Value from Memoized Component to Constant

Memoized component + default array/fn/object param → new instance each render → `memo()` fails. Extract default to module constant.

**Incorrect (`onClick` has different values on every rerender):**

```tsx
const UserAvatar = memo(function UserAvatar({ onClick = () => {} }: { onClick?: () => void }) {
  // ...
})

// Used without optional onClick
<UserAvatar />
```

**Correct (stable default value):**

```tsx
const NOOP = () => {};

const UserAvatar = memo(function UserAvatar({ onClick = NOOP }: { onClick?: () => void }) {
  // ...
})

// Used without optional onClick
<UserAvatar />
```
