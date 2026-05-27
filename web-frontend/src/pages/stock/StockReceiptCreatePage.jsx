import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi, supplierApi, warehouseApi } from '../../services/api';
import { invalidateProductCaches } from '../../utils/productCache';
import { useCompanyStores } from '../../hooks/useCompanyStores';

const emptyLine = () => ({
  productId: '',
  quantity: '1',
  purchasePrice: '',
  unitSellingPrice: '',
});

export default function StockReceiptCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  useEffect(() => {
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  const { data: products } = useQuery({
    queryKey: ['products-receipt-pick', effectiveStoreId],
    queryFn: () =>
      productApi
        .getAll({
          page: 0,
          size: 500,
          activeOnly: true,
          ...(effectiveStoreId ? { storeId: effectiveStoreId } : {}),
        })
        .then((r) => r.data),
    enabled: !needsStorePick || !!effectiveStoreId,
  });
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.getAll({ page: 0, size: 200 }).then((r) => r.data),
  });

  const catalog = products?.content ?? [];
  const supplierList = suppliers?.content ?? [];

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createReceipt(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.receiptCreated', { no: res.data.receiptNumber }));
      invalidateProductCaches(qc);
      navigate('/reports/stock/receipts');
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stockReports.receiptFailed')),
  });

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const onProductPick = (idx, productId) => {
    const p = catalog.find((x) => x.id === productId);
    if (!p) return;
    updateLine(idx, {
      productId,
      purchasePrice: String(p.costPrice ?? ''),
      unitSellingPrice: String(p.sellingPrice ?? ''),
    });
  };

  const submit = () => {
    const sid = resolveStoreId(storeId);
    if (!sid) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    const payload = {
      supplierId: supplierId || undefined,
      storeId: sid,
      notes: notes.trim() || undefined,
      lines: lines
        .filter((l) => l.productId)
        .map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          purchasePrice: Number(l.purchasePrice),
          unitSellingPrice: Number(l.unitSellingPrice),
        })),
    };
    if (payload.lines.length === 0) {
      toast.error(t('stockReports.receiptNeedLines'));
      return;
    }
    mutation.mutate(payload);
  };

  const inputCls = 'w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/reports/stock/receipts" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          ← {t('stockReports.receiptsTitle')}
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.receiptCreateTitle')}</h1>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">{t('stockReports.colSupplier')}</label>
          <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">—</option>
            {supplierList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t('stockReports.colStore')}</label>
          <select
            className={inputCls}
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            required={needsStorePick}
          >
            <option value="">{needsStorePick ? t('stockModal.pickStore') : t('stockReports.allStores')}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium">{t('stockReports.writeOffNotes')}</label>
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('stockReports.receiptLines')}</h2>
          <button
            type="button"
            onClick={() => setLines((p) => [...p, emptyLine()])}
            className="inline-flex items-center gap-1 text-sm text-emerald-700"
          >
            <Plus size={14} /> {t('stockReports.addLine')}
          </button>
        </div>
        {lines.map((line, idx) => (
          <div key={idx} className="grid gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <select
                className={inputCls}
                value={line.productId}
                onChange={(e) => onProductPick(idx, e.target.value)}
              >
                <option value="">{t('stockReports.pickProduct')}</option>
                {catalog.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                min={1}
                className={inputCls}
                placeholder={t('stockReports.colQty')}
                value={line.quantity}
                onChange={(e) => updateLine(idx, { quantity: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                className={inputCls}
                placeholder={t('stockReports.purchasePrice')}
                value={line.purchasePrice}
                onChange={(e) => updateLine(idx, { purchasePrice: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                className={inputCls}
                placeholder={t('stockReports.salePrice')}
                value={line.unitSellingPrice}
                onChange={(e) => updateLine(idx, { unitSellingPrice: e.target.value })}
              />
            </div>
            <div className="flex items-center sm:col-span-1">
              {lines.length > 1 && (
                <button type="button" onClick={() => setLines((p) => p.filter((_, i) => i !== idx))} className="text-red-600">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={mutation.isPending}
        onClick={submit}
        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {t('stockReports.receiptSubmit')}
      </button>
    </div>
  );
}
