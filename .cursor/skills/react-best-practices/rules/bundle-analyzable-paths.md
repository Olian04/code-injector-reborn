---
title: Prefer Statically Analyzable Paths
impact: HIGH
impactDescription: avoids accidental broad bundles and file traces
tags: bundle, nextjs, vite, webpack, rollup, esbuild, path
---

## Prefer Statically Analyzable Paths

Bundlers need obvious paths at build time. Variable/dynamic compose → broad include, warn, or widen file tracing. Prefer explicit maps / literal paths.

Cost of broad analysis: larger bundles, slower builds, worse cold starts, more memory.

### Import Paths

**Incorrect (the bundler cannot tell what may be imported):**

```ts
const PAGE_MODULES = {
  home: './pages/home',
  settings: './pages/settings',
} as const

const Page = await import(PAGE_MODULES[pageName])
```

**Correct (use an explicit map of allowed modules):**

```ts
const PAGE_MODULES = {
  home: () => import('./pages/home'),
  settings: () => import('./pages/settings'),
} as const

const Page = await PAGE_MODULES[pageName]()
```

### File-System Paths

**Incorrect (a 2-value enum still hides the final path from static analysis):**

```ts
const baseDir = path.join(process.cwd(), 'content/' + contentKind)
```

**Correct (make each final path literal at the callsite):**

```ts
const baseDir =
  kind === ContentKind.Blog
    ? path.join(process.cwd(), 'content/blog')
    : path.join(process.cwd(), 'content/docs')
```

Next.js: `path.join(process.cwd(), someVar)` widens output file tracing.
