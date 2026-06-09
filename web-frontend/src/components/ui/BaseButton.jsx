import clsx from 'clsx';

const VARIANT_CLS = {
  primary:
    'bg-emerald-500 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700',
  secondary:
    'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger:
    'bg-red-600 font-semibold text-white hover:bg-red-700 disabled:opacity-50',
  ghost:
    'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white',
};

const SIZE_CLS = {
  sm: 'rounded-lg px-3 py-1.5 text-xs',
  md: 'rounded-lg px-4 py-2 text-sm',
};

export default function BaseButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed',
        VARIANT_CLS[variant],
        SIZE_CLS[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
