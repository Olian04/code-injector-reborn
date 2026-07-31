/** Find the nearest ancestor matching a selector string or predicate. */
export function closest(
  el: Element | null,
  fn: string | ((el: Element) => boolean)
): Element | null {
  let current: Element | null = el;
  let predicate: (el: Element) => boolean;

  if (typeof fn === 'string') {
    const query = fn.trim();
    if (query[0] === '.') {
      predicate = (node) => node.classList.contains(query.slice(1));
    } else if (query[0] === '#') {
      predicate = (node) => node.id === query.slice(1);
    } else {
      predicate = (node) => node.tagName === query.toUpperCase();
    }
  } else {
    predicate = fn;
  }

  while (current) {
    if (predicate(current)) return current;
    current = current.parentElement;
  }

  return null;
}

/** Whether a Popover API element is currently showing. */
export function hasOpenPopover(): boolean {
  try {
    return document.querySelector(':popover-open') !== null;
  } catch {
    return false;
  }
}

/** Dismiss every showing popover; the manual ones have no light dismiss. */
export function closeOpenPopovers(): void {
  try {
    for (const el of document.querySelectorAll(':popover-open')) {
      (el as HTMLElement).hidePopover();
    }
  } catch {
    // No Popover API, so nothing is open.
  }
}

/** Index of an element among its parent's children. */
export function getElementIndex(el: Element): number {
  let index = 0;
  let curr: Element | null = el;
  while (curr?.previousElementSibling) {
    curr = curr.previousElementSibling;
    index++;
  }
  return index;
}
