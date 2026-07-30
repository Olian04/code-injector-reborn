/**
 * The Popover API attributes, which @types/react 18 does not know about yet.
 * They are lowercase because React 18 only forwards unknown attributes verbatim.
 */
declare module 'react' {
  interface HTMLAttributes<T> {
    popover?: 'auto' | 'manual';
    popovertarget?: string;
    popovertargetaction?: 'toggle' | 'show' | 'hide';
  }
}

export {};
