// src/components/stock/WarehouseReceiveModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi, warehouseApi } from '../../services/api';
import { invalidateProductCaches } from '../../utils/productCache';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

const labelCls = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';

export default function WarehouseReceiveModal({ open, onClose, initialProduct, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [vat, setVat] = useState('');
  const [marked, setMarked] = useState(false);
  const [storageLocation, setStorageLocation] = useState('');

  useEffect(() => {
    if (!open) return;
    setProductId(initialProduct?.id ?? '');
    setQuantity('');
    setUnitPrice('');
    setPurchasePrice('');
    setVat('');
    setMarked(false);
    setStorageLocation('');
  }, [open, initialProduct?.id]);

  const { data: catalog } = useQuery({
    queryKey: ['products', 'warehouse-catalog'],
    queryFn: () => productApi.getAll({ page: 0, size: 500, activeOnly: true }).then((r) => r.data),
    enabled: open,
  });

  const products = catalog?.content ?? [];
  const lockedProduct = !!initialProduct?.id;

  const { data: selectedProduct } = useQuery({
    queryKey: ['products', productId],
    queryFn: () => productApi.getById(productId).then((r) => r.data),
    enabled: open && !!productId,
  });

  useEffect(() => {
    if (!open || !selectedProduct) return;
    setUnitPrice(String(selectedProduct.sellingPrice ?? ''));
    setPurchasePrice(String(selectedProduct.costPrice ?? ''));
    const tr = selectedProduct.taxRate;
    if (tr === 0 || tr === '0') setVat('0');
    else if (Number(tr) === 12) setVat('12');
    setMarked(!!selectedProduct.markedProduct);
    if (selectedProduct.storageLocation) {
      setStorageLocation(selectedProduct.storageLocation);
    }
  }, [open, selectedProduct?.id, selectedProduct?.sellingPrice, selectedProduct?.costPrice]);

  const currentStock = selectedProduct?.stockQuantity ?? 0;
  const receiveQty = Number(quantity);
  const afterStock = useMemo(() => {
    if (!Number.isFinite(receiveQty) || receiveQty < 1) return null;
    return currentStock + Math.floor(receiveQty);
  }, [currentStock, receiveQty]);

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.receipt(body),
    onSuccess: () => {
      toast.success(t('stockModule.receiveOk'));
      invalidateProductCaches(qc);
      onSaved?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('stockModule.receiveFail'));
    },
  });

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!productId) {
      toast.error(t('validation.fieldRequired', { field: t('stockModule.modal.product') }));
      return;
    }
    const q = Number(quantity);
    if (!Number.isFinite(q) || q < 1) {
      toast.error(t('validation.fieldRequired', { field: t('stockModule.modal.qty') }));
      return;
    }
    const sell = Number(String(unitPrice).replace(',', '.'));
    const buy = Number(String(purchasePrice).replace(',', '.'));
    if (!Number.isFinite(sell) || sell < 0) {
      toast.error(t('validation.fieldRequired', { field: t('stockModule.modal.unitPrice') }));
      return;
    }
    if (!Number.isFinite(buy) || buy < 0) {
      toast.error(t('validation.fieldRequired', { field: t('stockModule.modal.purchase') }));
      return;
    }
    const body = {
      productId,
      quantity: Math.floor(q),
      unitSellingPrice: sell,
      purchasePrice: buy,
      markedProduct: marked,
      storageLocation: storageLocation.trim() || null,
    };
    if (vat === '0' || vat === '12') {
      body.vatPercent = Number(vat);
    }
    mutation.mutate(body);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('stockModule.modal.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            {t('stockModule.modal.sharedHint')}
          </p>
          {productId ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              {t('stockModule.modal.currentStock', { qty: currentStock })}
              {afterStock != null && (
                <span className="ml-2 text-slate-600 dark:text-slate-400">
                  {t('stockModule.modal.afterReceive', { qty: afterStock })}
                </span>
              )}
            </p>
          ) : null}
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-start">
            <label className={`${labelCls} sm:pt-2`}>
              <span className="text-red-600">*</span> {t('stockModule.modal.product')}
            </label>
            <div className="">
              <select
                required
                className={inputCls}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={lockedProduct}
              >
                <option value="">{t('stockModule.modal.productPh')}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('stockModule.modal.productHint')}</p>
            </div>
          </div>

          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('stockModule.modal.qty')}
            </label>
            <input
              className={inputCls}
              inputMode="numeric"
              placeholder={t('stockModule.modal.qtyPh')}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('stockModule.modal.unitPrice')}
            </label>
            <div className="relative">
              <input
                className={`${inputCls} pr-14`}
                inputMode="decimal"
                placeholder={t('stockModule.modal.unitPricePh')}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                {t('stockModule.modal.currency')}
              </span>
            </div>
          </div>

          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>{t('stockModule.modal.vat')}</label>
            <select className={inputCls} value={vat} onChange={(e) => setVat(e.target.value)}>
              <option value="">{t('stockModule.modal.vatUnset')}</option>
              <option value="0">{t('stockModule.modal.vat0')}</option>
              <option value="12">{t('stockModule.modal.vat12')}</option>
            </select>
          </div>

          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('stockModule.modal.purchase')}
            </label>
            <div className="relative">
              <input
                className={`${inputCls} pr-14`}
                inputMode="decimal"
                placeholder={t('stockModule.modal.purchasePh')}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                {t('stockModule.modal.currency')}
              </span>
            </div>
          </div>

          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>{t('stockModule.modal.location')}</label>
            <input
              className={inputCls}
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder={t('stockModule.modal.locationPh')}
            />
          </div>

          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>{t('stockModule.modal.marking')}</label>
            <button
              type="button"
              role="switch"
              aria-checked={marked}
              onClick={() => setMarked((v) => !v)}
              className={`relative h-8 w-14 rounded-full transition-colors ${marked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${marked ? 'left-7' : 'left-1'}`}
              />
            </button>
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
              {mutation.isPending ? t('common.processing') : t('stockModule.modal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
