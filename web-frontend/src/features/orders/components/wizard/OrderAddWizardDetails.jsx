import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSelect } from '../../../../components/ui';
import OrderAddWizardModal from './OrderAddWizardModal';

export default function OrderAddWizardDetails({
  storeName,
  onCancel,
  onBack,
  creatorEmail,
  couriers,
  form,
  setForm,
  canSubmit,
  onSubmit,
  submitting,
}) {
  const { t } = useTranslation();

  return (
    <OrderAddWizardModal
      title={t('orders.wizard.addOrderTitle')}
      wide
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
            disabled={!canSubmit || submitting}
            onClick={onSubmit}
            className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-500 dark:hover:bg-slate-400"
          >
            {t('orders.wizard.submitAdd')}
          </button>
        </>
      }
    >
      <div className="mb-5 flex flex-wrap items-baseline gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('orders.wizard.storePickerHint')}
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{storeName || '—'}</span>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <Pencil size={14} className="shrink-0" />
          {t('orders.wizard.changeStore')}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('orders.wizard.createdBy')}
            </span>
            <input
              type="text"
              readOnly
              value={creatorEmail || '—'}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
            />
          </label>
          <div>
            <BaseSelect
              label={t('orders.wizard.assignCourier')}
              value={form.courierId}
              onChange={(e) => setForm((f) => ({ ...f, courierId: e.target.value }))}
              placeholder={t('orders.filterDash')}
              options={[
                { value: '', label: t('orders.filterDash') },
                ...couriers.map((c) => ({ value: String(c.id), label: c.fullName })),
              ]}
            />
            {couriers.length === 0 ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <span aria-hidden>⚠</span>
                {t('orders.noCourierUsers')}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="text-red-500">*</span> {t('orders.wizard.clientName')}
            </span>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="text-red-500">*</span> {t('orders.wizard.address')}
            </span>
            <textarea
              rows={4}
              value={form.deliveryAddress}
              onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="text-red-500">*</span> {t('orders.wizard.clientPhone')}
            </span>
            <input
              type="text"
              value={form.clientPhone}
              onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('orders.wizard.comment')}
            </span>
            <textarea
              rows={4}
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>
      </div>
    </OrderAddWizardModal>
  );
}
