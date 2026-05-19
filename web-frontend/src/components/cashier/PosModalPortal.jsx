// Renders POS modals on document.body (avoids overflow/transform clipping).
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PosModalPortal({ open, onClose, children, overlayClassName = '' }) {
  const isFullscreen = overlayClassName.includes('pos-pay-overlay--screen');

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (isFullscreen) {
      document.documentElement.classList.add('pos-pay-screen-open');
      document.body.classList.add('pos-pay-screen-open');
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      if (isFullscreen) {
        document.documentElement.classList.remove('pos-pay-screen-open');
        document.body.classList.remove('pos-pay-screen-open');
      }
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, isFullscreen]);

  if (!open) return null;

  return createPortal(
    <div
      className={`pos-pay-overlay ${overlayClassName}`.trim()}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {children}
    </div>,
    document.body
  );
}
