// src/components/pos/PosPaymentModal.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader } from 'lucide-react';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

export default function PosPaymentModal({ open, onClose, total, onConfirm, isPending }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState('CASH');
  const [tendered, setTendered] = useState('');

  if (!open) return null;

  const tenderedNum = Number(tendered) || 0;
  const change = method === 'CASH' ? Math.max(0, tenderedNum - total) : 0;

  const handlePay = () => {
    onConfirm({
      paymentMethod: method,
      amountTendered: method === 'CASH' ? tenderedNum : total,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('pos.paymentTitle')}</h2>
          <button type="button" onClick={onClose} className="text-slate-500"><X size={20} /></button>
        </div>
        <p className="mb-4 text-2xl font-bold text-emerald-600">{fmt(total)}</p>
        <div className="mb-4 flex gap-2">
          {['CASH', 'CARD'].map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium ${method === m ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700'}`}>
              {t(m === 'CASH' ? 'pos.payCash' : 'pos.payCard')}
            </button>
          ))}
        </div>
        {method === 'CASH' && (
          <div className="mb-4">
            <label className="mb-1 block text-xs text-slate-500">{t('pos.amountTendered')}</label>
            <input type="number" min={0} step="0.01" value={tendered} onChange={(e) => setTendered(e.target.value)} className={inputCls} />
            {tenderedNum >= total && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('pos.change')}: <strong>{fmt(change)}</strong></p>
            )}
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2.5">{t('common.cancel')}</button>
          <button type="button" disabled={isPending || (method === 'CASH' && tenderedNum < total)}
            onClick={handlePay}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 font-semibold text-white disabled:opacity-50">
            {isPending && <Loader size={14} className="animate-spin" />}
            {t('pos.completeSale')}
          </button>
        </div>
      </div>
    </div>
  );
}
