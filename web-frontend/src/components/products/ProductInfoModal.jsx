// src/components/products/ProductInfoModal.jsx
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../services/api';
import { fmtMoney } from '../../utils/formatMoney';

const rowCls = 'flex items-center justify-between gap-4 border-b border-slate-200 py-2 text-sm dark:border-slate-800';
const labelCls = 'text-slate-500 dark:text-slate-400';
const valueCls = 'text-slate-900 dark:text-slate-100 font-medium';

const boolLabel = (v, t) => (v ? t('products.markingYes') : '—');

export default function ProductInfoModal({ open, productId, onClose, onEdit, onReceive, onDelete }) {
  const { t } = useTranslation();

  const { data: p, isPending, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getById(productId).then((r) => r.data),
    enabled: open && !!productId,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('products.info.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {isPending && (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</div>
          )}
          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {t('products.info.loadFail')}
            </div>
          )}

          {p && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-sm text-slate-500 dark:text-slate-400">{t('productCatalog.externalId')}:</div>
                <div className="font-mono text-sm text-slate-900 dark:text-slate-100">{p.id}</div>
                <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('productCatalog.ikpu')}:</div>
                <div className="font-mono text-sm text-slate-900 dark:text-slate-100">{p.ikpu || '—'}</div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className={rowCls}>
                  <span className={labelCls}>{t('products.colName')}:</span>
                  <span className={valueCls}>{p.name}</span>
                </div>
                <div className={rowCls}>
                  <span className={labelCls}>{t('products.colCategory')}:</span>
                  <span className={valueCls}>{p.categoryName ?? '—'}</span>
                </div>
                <div className={rowCls}>
                  <span className={labelCls}>{t('productCatalog.unit')}:</span>
                  <span className={valueCls}>{p.unitOfMeasure ?? '—'}</span>
                </div>
                <div className={rowCls}>
                  <span className={labelCls}>{t('productCatalog.unitCode')}:</span>
                  <span className={valueCls}>{p.unitMeasureCode ?? '—'}</span>
                </div>
                <div className={rowCls}>
                  <span className={labelCls}>{t('productCatalog.packageCode')}:</span>
                  <span className={valueCls}>{p.packageCode ?? '—'}</span>
                </div>
                <div className={rowCls}>
                  <span className={labelCls}>{t('productCatalog.soldByPiece')}:</span>
                  <span className={valueCls}>{p.soldIndividually ? t('products.markingYes') : '—'}</span>
                </div>
                <div className={rowCls}>
                  <span className={labelCls}>{t('productCatalog.marked')}:</span>
                  <span className={valueCls}>{boolLabel(p.markedProduct, t)}</span>
                </div>
                <div className={rowCls}>
                  <span className={labelCls}>{t('productCatalog.active')}:</span>
                  <span className={valueCls}>{p.active ? t('products.markingYes') : '—'}</span>
                </div>
                <div className={rowCls}>
                  <span className={labelCls}>{t('productCatalog.commissionTin')}:</span>
                  <span className={valueCls}>{p.commissionTin ?? '—'}</span>
                </div>
                <div className={rowCls}>
                  <span className={labelCls}>{t('productCatalog.commissionPinfl')}:</span>
                  <span className={valueCls}>{p.commissionPinfl ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-2 text-sm">
                  <span className={labelCls}>{t('productCatalog.vat')}:</span>
                  <span className={valueCls}>{p.taxRate != null ? `${Number(p.taxRate).toFixed(2)} %` : '—'}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                  <span className={labelCls}>{t('productCatalog.ownerType')}:</span>
                  <span className={valueCls}>{t(`productCatalog.owner.${p.ownerType ?? 'OWN'}`)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">{t('productCatalog.sectionPrices')}:</div>
                {(p.storePrices?.length ?? 0) === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">—</div>
                ) : (
                  <div className="space-y-2">
                    {p.storePrices.map((sp) => (
                      <div key={sp.storeId} className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-700 dark:text-slate-200">{sp.storeName}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {fmtMoney(sp.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onEdit?.(p)}
            disabled={!p}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600"
          >
            {t('products.rowEdit')}
          </button>
          <button
            type="button"
            onClick={() => onReceive?.(p)}
            disabled={!p}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600"
          >
            {t('products.rowReceive')}
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(p)}
            disabled={!p}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600"
          >
            {t('products.rowDelete')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('products.info.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

