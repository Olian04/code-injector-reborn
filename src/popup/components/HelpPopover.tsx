import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A help bubble built on the Popover API, so the browser handles the top layer,
 * light dismiss and Escape.
 *
 * Placement is computed here rather than with CSS anchor positioning, which
 * Firefox does not support yet; a popover lives in the top layer, so its
 * containing block is the viewport and ordinary absolute positioning cannot
 * follow the trigger.
 */

const GAP = 6;
const EDGE = 8;

function place(panel: HTMLElement, trigger: HTMLElement): void {
  // Measure from a known origin: the panel is already open at this point.
  panel.style.left = '0px';
  panel.style.top = '0px';

  const anchor = trigger.getBoundingClientRect();
  const box = panel.getBoundingClientRect();
  const maxLeft = window.innerWidth - box.width - EDGE;
  const left = Math.min(
    Math.max(EDGE, anchor.left + anchor.width / 2 - box.width / 2),
    Math.max(EDGE, maxLeft)
  );

  let top = anchor.bottom + GAP;
  if (top + box.height > window.innerHeight - EDGE) {
    const above = anchor.top - GAP - box.height;
    top =
      above >= EDGE
        ? above
        : Math.max(EDGE, window.innerHeight - box.height - EDGE);
  }

  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

interface HelpPopoverProps {
  id: string;
  heading: string;
  /** Accessible name for the trigger, which is icon-only. */
  label: string;
  /** Extra class on the trigger, for callers that position it themselves. */
  triggerClass?: string;
  children: ReactNode;
}

export function HelpPopover({
  id,
  heading,
  label,
  triggerClass,
  children,
}: HelpPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!panel || !trigger) return;

    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'open') place(panel, trigger);
    };

    panel.addEventListener('toggle', onToggle);
    return () => panel.removeEventListener('toggle', onToggle);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`help-trigger material-icons${triggerClass ? ` ${triggerClass}` : ''}`}
        data-name={`btn-${id}`}
        popovertarget={id}
        aria-label={label}
        title={label}
        tabIndex={-1}
      >
        &#xE8FD;
      </button>
      <div
        ref={panelRef}
        id={id}
        popover="auto"
        className="help-popover"
        data-name={`po-${id}`}
      >
        <div className="hp-heading">{heading}</div>
        <div className="hp-body">{children}</div>
      </div>
    </>
  );
}
