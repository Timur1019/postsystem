import { useTranslation } from 'react-i18next';
import OrderAddWizardModal from './OrderAddWizardModal';

export default function OrderAddWizardSelectStore({ stores, value, onChange, onCancel, onNext }) {
  const { t } = useTranslation();
  const canNext = value !== '' && value !== undefined;

  return (
    <OrderAddWizardModal
      title={t('orders.wizard.selectStoreTitle')}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {t('orders.wizard.cancel')}
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={onNext}
            className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-500 dark:hover:bg-slate-400"
          >
            {t('orders.wizard.save')}
          </button>
        </>
      }
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          <span className="text-red-500">*</span> {t('orders.wizard.storeLabel')}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="">{t('orders.filterDash')}</option>
          {stores
            .filter((s) => s.active !== false)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </label>
    </OrderAddWizardModal>
  );
}
