# Sections

Section ID (paren) = filename prefix. Upstream `server` / `rendering` / `js` / `advanced` removed — see [`../MISMATCHES.md`](../MISMATCHES.md).

## 1. Eliminating Waterfalls (async)

**Impact:** CRITICAL  
Sequential await = full latency each. Biggest win.

## 2. Bundle Size Optimization (bundle)

**Impact:** CRITICAL  
Smaller initial bundle → better TTI/LCP.

## 3. Client-Side Data Fetching (client)

**Impact:** MEDIUM-HIGH  
`browser.storage` + shared listeners. Upstream SWR rule removed.

## 4. Re-render Optimization (rerender)

**Impact:** MEDIUM  
Fewer wasted re-renders → snappier UI.
