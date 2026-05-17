// src/components/orders/OrderAddWizard.jsx — магазин → форма «Добавить заказ»
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { orderApi } from '../../services/api';

function ModalShell({ title, children, onClose, footer, wide }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 ${
          wide ? 'max-w-4xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="pr-8 text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function StepSelectStore({ stores, value, onChange, onCancel, onNext }) {
  const { t } = useTranslation();
  const canNext = value !== '' && value !== undefined;

  return (
    <ModalShell
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
    </ModalShell>
  );
}

function StepOrderDetails({
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
    <ModalShell
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
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('orders.wizard.assignCourier')}
            </span>
            <select
              value={form.courierId}
              onChange={(e) => setForm((f) => ({ ...f, courierId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">{t('orders.filterDash')}</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
            {couriers.length === 0 ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <span aria-hidden>⚠</span>
                {t('orders.noCourierUsers')}
              </p>
            ) : null}
          </label>
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
    </ModalShell>
  );
}

const emptyForm = () => ({
  clientName: '',
  clientPhone: '',
  deliveryAddress: '',
  comment: '',
  courierId: '',
});

export default function OrderAddWizard({ open, onClose, stores, onCreated }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [step, setStep] = useState('store');
  const [storeId, setStoreId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const { data: couriers = [] } = useQuery({
    queryKey: ['order-couriers'],
    queryFn: () => orderApi.getCouriers().then((r) => r.data),
    enabled: open && step === 'details',
  });

  const createMutation = useMutation({
    mutationFn: (body) => orderApi.create(body),
    onSuccess: (res) => {
      toast.success(t('orders.wizard.createdSuccess', { id: res.data.id }));
      onCreated?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('orders.wizard.createFailed'));
    },
  });

  useEffect(() => {
    if (!open) {
      setStep('store');
      setStoreId('');
      setForm(emptyForm());
    }
  }, [open]);

  const storeName = useMemo(() => {
    const s = stores.find((x) => String(x.id) === String(storeId));
    return s?.name ?? '';
  }, [stores, storeId]);

  const handleCancel = () => {
    onClose();
  };

  const handleStoreNext = () => {
    if (!storeId) return;
    setStep('details');
  };

  const canSubmit =
    storeId &&
    form.clientName.trim() &&
    form.clientPhone.trim() &&
    form.deliveryAddress.trim();

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(t('orders.wizard.validationRequired'));
      return;
    }
    const body = {
      storeId: Number(storeId),
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim(),
      deliveryAddress: form.deliveryAddress.trim(),
      comment: form.comment.trim() || undefined,
      courierId: form.courierId || undefined,
    };
    createMutation.mutate(body);
  };

  if (!open) return null;

  const node =
    step === 'store' ? (
      <StepSelectStore
        stores={stores.filter((s) => s.active)}
        value={storeId}
        onChange={setStoreId}
        onCancel={handleCancel}
        onNext={handleStoreNext}
      />
    ) : (
      <StepOrderDetails
        storeName={storeName}
        onCancel={handleCancel}
        onBack={() => setStep('store')}
        creatorEmail={user?.email}
        couriers={couriers}
        form={form}
        setForm={setForm}
        canSubmit={!!canSubmit}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
      />
    );

  return createPortal(node, document.body);
}
