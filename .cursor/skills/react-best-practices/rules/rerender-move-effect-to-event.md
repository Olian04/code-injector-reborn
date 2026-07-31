---
title: Put Interaction Logic in Event Handlers
impact: MEDIUM
impactDescription: avoids effect re-runs and duplicate side effects
tags: rerender, useEffect, events, side-effects, dependencies
---

## Put Interaction Logic in Event Handlers

User-action side effect (submit/click/drag) → run in handler. Not state+effect (re-runs on unrelated deps; can duplicate).

**Incorrect (event modeled as state + effect):**

```tsx
function Form() {
  const [submitted, setSubmitted] = useState(false)
  const theme = useContext(ThemeContext)

  useEffect(() => {
    if (submitted) {
      post('/api/register')
      showToast('Registered', theme)
    }
  }, [submitted, theme])

  return <button onClick={() => setSubmitted(true)}>Submit</button>
}
```

**Correct (do it in the handler):**

```tsx
function Form() {
  const theme = useContext(ThemeContext)

  function handleSubmit() {
    post('/api/register')
    showToast('Registered', theme)
  }

  return <button onClick={handleSubmit}>Submit</button>
}
```
