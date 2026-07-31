import type { CSSProperties } from 'react';
import type { CtxMenuState, InjectFeedback } from '../types';

interface ContextMenuProps {
  state: CtxMenuState;
  injectFeedback: InjectFeedback;
  onBackgroundClick: () => void;
  onEdit: () => void;
  onInject: () => void;
  onMoveTop: () => void;
  onMoveBottom: () => void;
  onToggleEnabled: () => void;
  onDelete: (confirm: boolean) => void;
  onInjectMouseLeave: () => void;
}

export function ContextMenu({
  state,
  injectFeedback,
  onBackgroundClick,
  onEdit,
  onInject,
  onMoveTop,
  onMoveBottom,
  onToggleEnabled,
  onDelete,
  onInjectMouseLeave,
}: ContextMenuProps) {
  const hidden =
    state.hiding ? 'progress' : state.visible ? 'false' : 'true';

  const ulStyle: CSSProperties = {};
  if (state.visible) {
    ulStyle.right = `${window.innerWidth - state.x}px`;
    if (state.reversed) {
      ulStyle.bottom = `${window.innerHeight - state.y}px`;
    } else {
      ulStyle.top = `${state.y}px`;
    }
  }

  return (
    <div
      className="ctx-menu"
      data-hidden={hidden}
      data-name="ctx-background"
      data-id={state.ruleId != null ? String(state.ruleId) : undefined}
      data-reversed={String(state.reversed)}
      onClick={(e) => {
        if ((e.target as HTMLElement).dataset.name === 'ctx-background') {
          onBackgroundClick();
        }
      }}
    >
      <ul style={ulStyle}>
        <li data-name="btn-rule-edit" onClick={onEdit}>
          <i className="material-icons">&#xE150;</i> Edit
        </li>
        <li
          data-name="btn-rule-inject"
          data-action={injectFeedback || undefined}
          onClick={onInject}
          onMouseLeave={onInjectMouseLeave}
        >
          <i className="material-icons">&#xE3E7;</i> Inject
        </li>
        <li className="sep" />
        <li data-name="btn-rule-movetop" onClick={onMoveTop}>
          <i className="material-icons">&#xE25A;</i> Move Top
        </li>
        <li data-name="btn-rule-movebottom" onClick={onMoveBottom}>
          <i className="material-icons">&#xE258;</i> Move Bottom
        </li>
        <li className="sep" />
        <li
          data-name="btn-rule-enabled"
          data-enabled={String(state.enabled)}
          onClick={onToggleEnabled}
        >
          <i className="material-icons">&#xE5CA;</i> Enabled
        </li>
        <li className="sep" />
        <li
          data-name="btn-rule-delete"
          onClick={(e) => {
            const target = e.currentTarget;
            if (target.dataset.confirm) {
              onDelete(true);
            } else {
              target.dataset.confirm = 'true';
              target.onmouseleave = () => {
                delete target.dataset.confirm;
                target.onmouseleave = null;
              };
              onDelete(false);
            }
          }}
        >
          <i className="material-icons">&#xE872;</i> Delete
        </li>
      </ul>
    </div>
  );
}
