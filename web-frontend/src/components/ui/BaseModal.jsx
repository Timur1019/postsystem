import { X } from 'lucide-react';
import clsx from 'clsx';
import BaseButton from './BaseButton';

const SIZE_CLS = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export default function BaseModal({
  open = true,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  className,
  bodyClassName,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className={clsx(
          'w-full rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900',
          SIZE_CLS[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'base-modal-title' : undefined}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            {title && (
              <h2
                id="base-modal-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                {title}
              </h2>
            )}
            {onClose && (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-auto p-1"
                aria-label="Close"
              >
                <X size={20} />
              </BaseButton>
            )}
          </div>
        )}
        <div className={clsx('p-5', bodyClassName)}>{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
