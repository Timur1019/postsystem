// src/components/suppliers/SupplierModal.jsx
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { supplierApi } from '../../services/api';
import { formatUzPhone, digitsAfter998, isCompleteUzPhone } from '../../utils/phoneUz';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

const labelCls = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

export default function SupplierModal({ open, onClose }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+998 ');

  useEffect(() => {
    if (!open) return;
    setName('');
    setTaxId('');
    setAddress('');
    setEmail('');
    setPhone('+998 ');
  }, [open]);

  const mutation = useMutation({
    mutationFn: (body) => supplierApi.create(body),
    onSuccess: () => {
      toast.success(t('suppliersModule.createdOk'));
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('suppliersModule.createdFail'));
    },
  });

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !taxId.trim()) {
      toast.error(t('validation.required'));
      return;
    }
    const body = {
      name: name.trim(),
      taxId: taxId.trim(),
      address: address.trim() || null,
      email: email.trim() || null,
      phone: isCompleteUzPhone(phone) ? formatUzPhone(phone).trim() : null,
    };
    mutation.mutate(body);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('suppliersModule.modal.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-4">
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('suppliersModule.modal.name')}
            </label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('suppliersModule.modal.taxId')}
            </label>
            <input className={inputCls} value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>{t('suppliersModule.modal.address')}</label>
            <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>{t('suppliersModule.modal.email')}</label>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>{t('suppliersModule.modal.phone')}</label>
            <input
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(formatUzPhone(e.target.value))}
              placeholder="+998 (__) ___-__-__"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600"
            >
              {mutation.isPending ? t('common.processing') : t('suppliersModule.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
