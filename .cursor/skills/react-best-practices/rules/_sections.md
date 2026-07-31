# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

Upstream originally included **Server-Side Performance (`server`)**,
**Rendering Performance (`rendering`)**, **JavaScript Performance (`js`)**, and
**Advanced Patterns (`advanced`)**; those categories were removed for
Code-Injector (client-only extension UI; fewer rules focused on async/bundle/
client/rerender). See [`../MISMATCHES.md`](../MISMATCHES.md).

---

## 1. Eliminating Waterfalls (async)

**Impact:** CRITICAL  
**Description:** Waterfalls are the #1 performance killer. Each sequential await adds full network latency. Eliminating them yields the largest gains.

## 2. Bundle Size Optimization (bundle)

**Impact:** CRITICAL  
**Description:** Reducing initial bundle size improves Time to Interactive and Largest Contentful Paint.

## 3. Client-Side Data Fetching (client)

**Impact:** MEDIUM-HIGH  
**Description:** Efficient client storage and event patterns for the extension UI (`browser.storage`, listeners). Upstream SWR dedup rule was removed.

## 4. Re-render Optimization (rerender)

**Impact:** MEDIUM  
**Description:** Reducing unnecessary re-renders minimizes wasted computation and improves UI responsiveness.
