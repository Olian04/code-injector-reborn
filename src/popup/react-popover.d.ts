/**
 * The Popover API attribute, which @types/react 18 does not know about yet.
 * It is lowercase because React 18 only forwards unknown attributes verbatim.
 */
declare module 'react' {
  interface HTMLAttributes<T> {
    popover?: 'auto' | 'manual';
  }
}

export {};
