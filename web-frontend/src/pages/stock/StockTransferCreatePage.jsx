import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi, storeApi, warehouseApi } from '../../services/api';

const emptyLine = () => ({ productId: '', quantity: '1' });

export default function StockTransferCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyLine()]);

  const { data: products } = useQuery({
    queryKey: ['products-trf-pick'],
    queryFn: () => productApi.getAll({ page: 0, size: 500, activeOnly: true }).then((r) => r.data),
  });
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const catalog = products?.content ?? [];

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createTransfer(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.transferCreated', { no: res.data.transferNumber }));
      navigate('/reports/stock/transfers');
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stockReports.transferFailed')),
  });

  const submit = () => {
    if (!fromStoreId || !toStoreId) {
      toast.error(t('stockReports.transferNeedStores'));
      return;
    }
    const payload = {
      fromStoreId: Number(fromStoreId),
      toStoreId: Number(toStoreId),
      notes: notes.trim() || undefined,
      lines: lines
        .filter((l) => l.productId)
        .map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
    };
    if (payload.lines.length === 0) {
      toast.error(t('stockReports.transferNeedLines'));
      return;
    }
    mutation.mutate(payload);
  };

  const inputCls = 'w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/reports/stock/transfers" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          ← {t('stockReports.transfersTitle')}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.transferCreateTitle')}</h1>
        <p className="text-sm text-slate-500">{t('stockReports.transferNote')}</p>
      </div>
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">{t('stockReports.fromStore')}</label>
          <select value={fromStoreId} onChange={(e) => setFromStoreId(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t('stockReports.toStore')}</label>
          <select value={toStoreId} onChange={(e) => setToStoreId(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {lines.map((line, idx) => (
          <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_6rem_auto]">
            <select
              value={line.productId}
              onChange={(e) => {
                const next = [...lines];
                next[idx] = { ...line, productId: e.target.value };
                setLines(next);
              }}
              className={inputCls}
            >
              <option value="">{t('stockReports.pickProduct')}</option>
              {catalog.map((pr) => (
                <option key={pr.id} value={pr.id}>{pr.name} — {pr.stockQuantity} {t('stockReports.unitsSuffix')}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => {
                const next = [...lines];
                next[idx] = { ...line, quantity: e.target.value };
                setLines(next);
              }}
              className={inputCls}
            />
            <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} className="text-red-600">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setLines((p) => [...p, emptyLine()])} className="inline-flex items-center gap-1 text-sm text-emerald-700">
          <Plus size={16} /> {t('stockReports.addLine')}
        </button>
      </div>
      <button type="button" onClick={submit} disabled={mutation.isPending} className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        {t('stockReports.transferSubmit')}
      </button>
    </div>
  );
}
