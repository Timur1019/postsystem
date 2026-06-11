// src/components/stock/WarehouseReceiveModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi, warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { formatQty, parseQtyInput, roundQty } from '../../../utils/quantityFormat';
import { getUnitConfig } from '../../../utils/unitConfig';
import { BaseSelect } from '../../../components/ui';
import { ProductLookupSelect } from '../../../components/product-lookup';
import UnitConversionHelper from '../../../components/shared/UnitConversionHelper';

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
  const [storeId, setStoreId] = useState('');
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  useEffect(() => {
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

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

  const lockedProduct = !!initialProduct?.id;

  const { data: selectedProduct } = useQuery({
    queryKey: ['products', productId, effectiveStoreId],
    queryFn: () =>
      productApi
        .getById(productId, effectiveStoreId ? { storeId: effectiveStoreId } : undefined)
        .then((r) => r.data),
    enabled: open && !!productId && (!needsStorePick || !!effectiveStoreId),
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

  const unitCode = selectedProduct?.unitCode || 'PCS';
  const saleType = selectedProduct?.saleType || 'PIECE';
  const unitConfig = getUnitConfig(unitCode);
  const currentStock = selectedProduct?.stockQuantity ?? 0;
  const parsedReceiveQty = parseQtyInput(quantity, saleType, unitCode);
  const afterStock = useMemo(() => {
    if (parsedReceiveQty == null) return null;
    const sum = currentStock + parsedReceiveQty;
    return unitConfig.scale === 0 ? Math.round(sum) : roundQty(sum);
  }, [currentStock, parsedReceiveQty, unitConfig.scale]);

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
    const q = parseQtyInput(quantity, saleType, unitCode);
    if (q == null) {
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
    const sid = resolveStoreId(storeId);
    if (!sid) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    const body = {
      productId,
      storeId: sid,
      quantity: q,
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
              {t('stockModule.modal.currentStock', {
                qty: formatQty(currentStock, saleType, unitCode),
              })}
              {afterStock != null && (
                <span className="ml-2 text-slate-600 dark:text-slate-400">
                  {t('stockModule.modal.afterReceive', {
                    qty: formatQty(afterStock, saleType, unitCode),
                  })}
                </span>
              )}
            </p>
          ) : null}
          {needsStorePick ? (
            <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-start">
              <BaseSelect
                className="sm:col-span-2"
                label={t('stockReports.colStore')}
                required
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder={t('stockModal.pickStore')}
                options={[
                  { value: '', label: t('stockModal.pickStore') },
                  ...stores.map((s) => ({ value: String(s.id), label: s.name })),
                ]}
              />
            </div>
          ) : null}

          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-start">
            <div className="sm:col-span-2">
              <ProductLookupSelect
                label={t('stockModule.modal.product')}
                required
                value={productId}
                storeId={effectiveStoreId}
                disabled={lockedProduct || (needsStorePick && !effectiveStoreId)}
                placeholder={t('stockModule.modal.productPh')}
                onChange={(e) => setProductId(e.target.value)}
                onProductSelect={(product) => {
                  if (product) setProductId(String(product.id));
                  else setProductId('');
                }}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('stockModule.modal.productHint')}</p>
            </div>
          </div>

          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
            <label className={labelCls}>
              <span className="text-red-600">*</span> {t('stockModule.modal.qty')}
            </label>
            <div>
              <input
                className={inputCls}
                inputMode="decimal"
                placeholder={t('stockModule.modal.qtyPh')}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              {selectedProduct ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('stockModule.modal.qtyUnitHint', { unit: unitConfig.label })}
                </p>
              ) : null}
              {selectedProduct ? (
                <UnitConversionHelper
                  t={t}
                  stockUnitCode={unitCode}
                  standardLength={selectedProduct.constructionDetails?.standardLength}
                  onApplyStockQty={(qty) => setQuantity(String(qty))}
                />
              ) : null}
            </div>
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
            <BaseSelect
              className="sm:col-span-2"
              label={t('stockModule.modal.vat')}
              value={vat}
              onChange={(e) => setVat(e.target.value)}
              placeholder={t('stockModule.modal.vatUnset')}
              options={[
                { value: '', label: t('stockModule.modal.vatUnset') },
                { value: '0', label: t('stockModule.modal.vat0') },
                { value: '12', label: t('stockModule.modal.vat12') },
              ]}
            />
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
