export const userFormInputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
  focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export function toStoreIdSet(ids) {
  const list = Array.isArray(ids) ? ids : [];
  return new Set(list.map((id) => Number(id)).filter((n) => !Number.isNaN(n)));
}

export function cashierStoreSet(ids) {
  const arr = Array.from(toStoreIdSet(ids));
  return arr.length > 0 ? new Set([arr[0]]) : new Set();
}

export function asStoreList(data) {
  return Array.isArray(data) ? data : [];
}
