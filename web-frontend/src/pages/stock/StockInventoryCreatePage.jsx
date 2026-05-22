import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi, storeApi, warehouseApi } from '../../services/api';
import { invalidateProductCaches } from '../../utils/productCache';

const emptyLine = () => ({ productId: '', countedQuantity: '' });

export default function StockInventoryCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [storeId, setStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyLine()]);

  const { data: products } = useQuery({
    queryKey: ['products-inv-pick'],
    queryFn: () => productApi.getAll({ page: 0, size: 500, activeOnly: true }).then((r) => r.data),
  });
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const catalog = products?.content ?? [];

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createInventory(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.inventoryCreated', { no: res.data.inventoryNumber }));
      invalidateProductCaches(qc);
      navigate('/reports/stock/inventories');
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stockReports.inventoryFailed')),
  });

  const submit = () => {
    const payload = {
      storeId: storeId === '' ? undefined : Number(storeId),
      notes: notes.trim() || undefined,
      lines: lines
        .filter((l) => l.productId)
        .map((l) => ({
          productId: l.productId,
          countedQuantity: Number(l.countedQuantity),
        })),
    };
    if (payload.lines.length === 0) {
      toast.error(t('stockReports.inventoryNeedLines'));
      return;
    }
    mutation.mutate(payload);
  };

  const inputCls = 'w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/reports/stock/inventories" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          ← {t('stockReports.inventoriesTitle')}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.inventoryCreateTitle')}</h1>
      </div>
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">{t('stockReports.colStore')}</label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">{t('stockReports.writeOffNotes')}</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold">{t('stockReports.inventoryLines')}</h2>
        {lines.map((line, idx) => {
          const p = catalog.find((x) => x.id === line.productId);
          return (
            <div key={idx} className="grid gap-2 rounded-lg border border-slate-100 p-3 dark:border-slate-800 sm:grid-cols-[1fr_8rem_8rem_auto]">
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
                  <option key={pr.id} value={pr.id}>{pr.name} ({pr.sku})</option>
                ))}
              </select>
              <div className="text-xs text-slate-500 self-center">
                {p ? t('stockReports.systemQty', { qty: p.stockQuantity }) : '—'}
              </div>
              <input
                type="number"
                min={0}
                placeholder={t('stockReports.countedQty')}
                value={line.countedQuantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx] = { ...line, countedQuantity: e.target.value };
                  setLines(next);
                }}
                className={inputCls}
              />
              <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} className="text-red-600">
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
        <button type="button" onClick={() => setLines((p) => [...p, emptyLine()])} className="inline-flex items-center gap-1 text-sm text-emerald-700">
          <Plus size={16} /> {t('stockReports.addLine')}
        </button>
      </div>
      <button type="button" onClick={submit} disabled={mutation.isPending} className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        {t('stockReports.inventorySubmit')}
      </button>
    </div>
  );
}
