import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, visible: _visible, onClose, children }: ModalProps) {
  // Visibility is controlled via body[data-modalvisible] in options-ui.scss
  return (
    <div
      id="modal"
      data-name="btn-hide-modal"
      onClick={(e) => {
        if ((e.target as HTMLElement).dataset.name === 'btn-hide-modal') {
          onClose();
        }
      }}
    >
      <div className="m-wrapper">
        <div className="m-head">
          <span className="m-title">{title}</span>
          <i className="material-icons" data-name="btn-hide-modal" onClick={onClose}>
            {'\uE5CD'}
          </i>
        </div>
        <div className="m-body">{children}</div>
      </div>
    </div>
  );
}
