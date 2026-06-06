// src/components/products/ProductInfoModal.jsx
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../services/api';
import { fmtMoney } from '../../utils/formatMoney';
import ProductLifecycleSection from './ProductLifecycleSection';
import { getProductTemplateTitle } from '../../config/productCatalogTemplateRegistry';

const rowCls = 'flex items-center justify-between gap-4 border-b border-slate-200 py-2 text-sm dark:border-slate-800';
const labelCls = 'text-slate-500 dark:text-slate-400';
const valueCls = 'text-slate-900 dark:text-slate-100 font-medium';

const boolLabel = (v, t) => (v ? t('products.markingYes') : '—');

const tabBtn = (active) =>
  `rounded-lg px-4 py-2 text-sm font-medium transition ${
    active
      ? 'bg-emerald-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export default function ProductInfoModal({
  open,
  productId,
  initialTab = 'details',
  onClose,
  onEdit,
  onReceive,
  onDelete,
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, productId, initialTab]);

  const { data: p, isPending, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getById(productId).then((r) => r.data),
    enabled: open && !!productId,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('products.info.title')}</h2>
            {p?.name && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{p.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex shrink-0 gap-2 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <button type="button" className={tabBtn(tab === 'details')} onClick={() => setTab('details')}>
            {t('products.info.tabDetails')}
          </button>
          <button
            type="button"
            className={tabBtn(tab === 'lifecycle')}
            onClick={() => setTab('lifecycle')}
            disabled={!productId}
          >
            {t('products.info.tabLifecycle')}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === 'details' && (
            <>
              {isPending && (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('common.loading')}
                </div>
              )}
              {isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  {t('products.info.loadFail')}
                </div>
              )}
              {p && <ProductDetailsBody p={p} t={t} />}
            </>
          )}

          {tab === 'lifecycle' && productId && <ProductLifecycleSection productId={productId} />}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
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

function ProductDetailsBody({ p, t }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="text-sm text-slate-500 dark:text-slate-400">{t('productCatalog.externalId')}:</div>
        <div className="font-mono text-sm text-slate-900 dark:text-slate-100">{p.id}</div>
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('productCatalog.ikpu')}:</div>
        <div className="font-mono text-sm text-slate-900 dark:text-slate-100">{p.ikpu || '—'}</div>
        {p.storageLocation && (
          <>
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('stockModule.modal.location')}:</div>
            <div className="text-sm text-slate-900 dark:text-slate-100">{p.storageLocation}</div>
          </>
        )}
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
          <span className={labelCls}>{t('products.colTemplate')}:</span>
          <span className={valueCls}>{getProductTemplateTitle(t, p) ?? '—'}</span>
        </div>
        {p.retailExtras?.clothingSizeRange || p.retailExtras?.clothingColor ? (
          <>
            <div className={rowCls}>
              <span className={labelCls}>{t('productCatalog.clothingSizeRange')}:</span>
              <span className={valueCls}>{p.retailExtras.clothingSizeRange ?? '—'}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>{t('productCatalog.clothingColor')}:</span>
              <span className={valueCls}>{p.retailExtras.clothingColor ?? '—'}</span>
            </div>
          </>
        ) : null}
        {p.retailExtras?.pharmacyDosageForm ? (
          <div className={rowCls}>
            <span className={labelCls}>{t('productCatalog.pharmacyDosageForm')}:</span>
            <span className={valueCls}>{p.retailExtras.pharmacyDosageForm}</span>
          </div>
        ) : null}
        <div className={rowCls}>
          <span className={labelCls}>{t('productCatalog.unit')}:</span>
          <span className={valueCls}>{p.unitOfMeasure ?? '—'}</span>
        </div>
        {p.constructionDetails ? (
          <>
            <div className={rowCls}>
              <span className={labelCls}>{t('productCatalog.constructionStandardLength')}:</span>
              <span className={valueCls}>{p.constructionDetails.standardLength ?? '—'}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>{t('productCatalog.constructionAllowCutting')}:</span>
              <span className={valueCls}>{boolLabel(p.constructionDetails.allowCutting, t)}</span>
            </div>
          </>
        ) : null}
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
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-2 text-sm dark:border-slate-800">
          <span className={labelCls}>{t('products.colStock')}:</span>
          <span className={valueCls}>{p.stockQuantity}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-2 text-sm dark:border-slate-800">
          <span className={labelCls}>{t('products.lifecycle.dispatched')}:</span>
          <span className={valueCls}>{p.stockDispatched ?? 0}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-2 text-sm">
          <span className={labelCls}>{t('productCatalog.vat')}:</span>
          <span className={valueCls}>{p.taxRate != null ? `${Number(p.taxRate).toFixed(2)} %` : '—'}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
          {t('productCatalog.sectionPrices')}:
        </div>
        {(p.storePrices?.length ?? 0) === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">—</div>
        ) : (
          <div className="space-y-2">
            {p.storePrices.map((sp) => (
              <div key={sp.storeId} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-700 dark:text-slate-200">{sp.storeName}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{fmtMoney(sp.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
