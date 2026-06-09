export const productInfoRowCls =
  'flex items-center justify-between gap-4 border-b border-slate-200 py-2 text-sm dark:border-slate-800';
export const productInfoLabelCls = 'text-slate-500 dark:text-slate-400';
export const productInfoValueCls = 'text-slate-900 dark:text-slate-100 font-medium';

export const productInfoTabBtn = (active) =>
  `rounded-lg px-4 py-2 text-sm font-medium transition ${
    active
      ? 'bg-emerald-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export const productInfoBoolLabel = (value, t) => (value ? t('products.markingYes') : '—');
