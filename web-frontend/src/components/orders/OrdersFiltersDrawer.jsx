// src/components/orders/OrdersFiltersDrawer.jsx
import { useTranslation } from 'react-i18next';

export default function OrdersFiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
  onApply,
  onReset,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {t('orders.filterPanelTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">{t('orders.filterExternalNo')}</span>
            <input
              type="text"
              value={filters.externalNumber}
              onChange={(e) => set('externalNumber', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">{t('orders.filterClientName')}</span>
            <input
              type="text"
              value={filters.clientName}
              onChange={(e) => set('clientName', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">{t('orders.filterAddress')}</span>
            <input
              type="text"
              value={filters.address}
              onChange={(e) => set('address', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">{t('orders.filterCourier')}</span>
            <select
              value={filters.courierId}
              onChange={(e) => set('courierId', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">{t('orders.filterDash')}</option>
            </select>
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <span aria-hidden>⚠</span>
              {t('orders.noCourierUsers')}
            </p>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">{t('orders.filterStatus')}</span>
            <select
              value={filters.status}
              onChange={(e) => set('status', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">{t('orders.filterDash')}</option>
              <option value="NEW">{t('orders.statusNew')}</option>
              <option value="DELIVERED">{t('orders.statusDelivered')}</option>
              <option value="DONE">{t('orders.statusDone')}</option>
              <option value="CANCELLED">{t('orders.statusCancelled')}</option>
            </select>
          </label>
          <div>
            <span className="mb-1 block text-xs text-slate-500">{t('orders.filterCreatedRange')}</span>
            <div className="flex gap-2">
              <label className="flex-1">
                <span className="mb-0.5 block text-[10px] uppercase text-slate-400">{t('orders.filterFrom')}</span>
                <input
                  type="date"
                  value={filters.createdFrom}
                  onChange={(e) => set('createdFrom', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </label>
              <label className="flex-1">
                <span className="mb-0.5 block text-[10px] uppercase text-slate-400">{t('orders.filterTo')}</span>
                <input
                  type="date"
                  value={filters.createdTo}
                  onChange={(e) => set('createdTo', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {t('orders.filterReset')}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-lg bg-emerald-800 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            {t('orders.filterApply')}
          </button>
        </div>
      </aside>
    </div>
  );
}
