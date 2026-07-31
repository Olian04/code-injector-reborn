import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { closeOpenPopovers } from '../dom';

/**
 * A help bubble built on the Popover API, so the browser handles the top layer.
 *
 * The bubble explains a control rather than sitting beside it, so it is opened
 * by hovering that control. Dismissal is `manual`: `auto` would light-dismiss on
 * the very click the control exists for.
 *
 * Placement is computed here rather than with CSS anchor positioning, which
 * Firefox does not support yet; a popover lives in the top layer, so its
 * containing block is the viewport and ordinary absolute positioning cannot
 * follow the trigger.
 */

const GAP = 6;
const EDGE = 8;

/** Long enough to cross the gap between the control and the bubble. */
const CLOSE_DELAY = 250;

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
  /** The control this explains. Hovering it opens the bubble. */
  anchorRef: RefObject<HTMLElement>;
  children: ReactNode;
}

export function HelpPopover({
  id,
  heading,
  anchorRef,
  children,
}: HelpPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel || !anchor) return;

    let closeTimer = 0;

    const keepOpen = () => {
      window.clearTimeout(closeTimer);
      closeTimer = 0;
    };

    const open = () => {
      keepOpen();
      if (panel.matches(':popover-open')) return;
      // Manual popovers do not dismiss each other, so only one is left showing.
      closeOpenPopovers();
      panel.showPopover();
      place(panel, anchor);
    };

    // The pointer has to cross a gap to reach the bubble, and the bubble can
    // scroll, so leaving the control only arms a delayed close.
    const close = () => {
      keepOpen();
      closeTimer = window.setTimeout(() => {
        if (panel.matches(':popover-open')) panel.hidePopover();
      }, CLOSE_DELAY);
    };

    anchor.addEventListener('pointerenter', open);
    anchor.addEventListener('pointerleave', close);
    panel.addEventListener('pointerenter', keepOpen);
    panel.addEventListener('pointerleave', close);

    return () => {
      window.clearTimeout(closeTimer);
      anchor.removeEventListener('pointerenter', open);
      anchor.removeEventListener('pointerleave', close);
      panel.removeEventListener('pointerenter', keepOpen);
      panel.removeEventListener('pointerleave', close);
    };
  }, [anchorRef]);

  return (
    <div
      ref={panelRef}
      id={id}
      popover="manual"
      className="help-popover"
      data-name={`po-${id}`}
    >
      <div className="hp-heading">{heading}</div>
      <div className="hp-body">{children}</div>
    </div>
  );
}
