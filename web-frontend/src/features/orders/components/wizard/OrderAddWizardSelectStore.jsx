import { useTranslation } from 'react-i18next';
import { BaseSelect } from '../../../../components/ui';
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
      <BaseSelect
        label={t('orders.wizard.storeLabel')}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('orders.filterDash')}
        options={[
          { value: '', label: t('orders.filterDash') },
          ...stores
            .filter((s) => s.active !== false)
            .map((s) => ({ value: String(s.id), label: s.name })),
        ]}
      />
    </OrderAddWizardModal>
  );
}
