export const LIFECYCLE_MOVEMENT_TYPES = ['ALL', 'RESTOCK', 'SALE', 'RETURN', 'WRITE_OFF', 'ADJUSTMENT'];

export const lifecycleQtyClass = (n) => {
  if (n > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (n < 0) return 'text-red-600 dark:text-red-400';
  return 'text-slate-500';
};
