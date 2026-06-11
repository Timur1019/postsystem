// src/components/cash-registers/CashRegisterConfigFiltersDrawer.jsx
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSelect } from '../../../components/ui';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export default function CashRegisterConfigFiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
  onApply,
  onReset,
  stores,
  serials,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <aside className="relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900">
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">{t('cashRegisters.filterPanelTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <BaseSelect
            label={t('cashRegisters.configFilterStore')}
            value={filters.storeId}
            onChange={(e) => set('storeId', e.target.value)}
            placeholder={t('cashRegisters.configFilterAll')}
            options={[
              { value: '', label: t('cashRegisters.configFilterAll') },
              ...stores.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
          <BaseSelect
            label={t('cashRegisters.configFilterSerial')}
            value={filters.equipmentSerial}
            onChange={(e) => set('equipmentSerial', e.target.value)}
            placeholder={t('cashRegisters.configFilterAll')}
            options={[
              { value: '', label: t('cashRegisters.configFilterAll') },
              ...serials.map((sn) => ({ value: sn, label: sn })),
            ]}
          />
        </div>
        <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('products.filters.reset')}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {t('common.apply')}
          </button>
        </div>
      </aside>
    </div>
  );
}
