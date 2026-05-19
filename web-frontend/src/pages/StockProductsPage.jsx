// src/pages/StockProductsPage.jsx
import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Search, Filter, Plus, Info, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { warehouseApi, productApi, categoryApi, storeApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import StockProductsFiltersDrawer from '../components/stock/StockProductsFiltersDrawer';
import WarehouseReceiveModal from '../components/stock/WarehouseReceiveModal';
import ProductCatalogModal from '../components/products/ProductCatalogModal';
import StockAdjustModal from '../components/products/StockAdjustModal';
import ProductInfoModal from '../components/products/ProductInfoModal';
import { invalidateProductCaches } from '../utils/productCache';
import TablePagination from '../components/shared/TablePagination';

const canManage = (role) => role === 'ADMIN' || role === 'MANAGER';

const defaultFilters = { barcode: '', markedProduct: '' };

export default function StockProductsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const manage = canManage(user?.role);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  const [rowMenu, setRowMenu] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [receiveProduct, setReceiveProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [infoProductId, setInfoProductId] = useState(null);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      barcode: applied.barcode.trim() || undefined,
      markedProduct:
        applied.markedProduct === '' ? undefined : applied.markedProduct === 'true',
    }),
    [search, page, pageSize, applied]
  );

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ['warehouse-products', queryParams],
    queryFn: () => warehouseApi.getProducts(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;
  const showEmptyHint = !loading && !isFetching && !isError && total === 0;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [totalPages, page]);

  useEffect(() => {
    if (!rowMenu) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setRowMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rowMenu]);

  useEffect(() => {
    setRowMenu(null);
  }, [page, search, applied.barcode, applied.markedProduct]);

  const displayBarcode = (p) => {
    if (p.barcodes?.length) return p.barcodes[0];
    return p.barcode || '—';
  };

  const colCount = 7;

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.data?.message ?? error?.message ?? t('stockModule.loadError')}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockModule.title')}</h1>
        <div className="flex flex-wrap gap-2">
          {manage && (
            <button
              type="button"
              onClick={() => setReceiveOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Plus size={16} />
              {t('stockModule.add')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600"
          >
            <Filter size={16} />
            {t('products.toolbar.filters')}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder={t('stockModule.searchPh')}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                <th className="px-4 py-3">{t('stockModule.colProduct')}</th>
                <th className="px-4 py-3">{t('stockModule.colCategory')}</th>
                <th className="px-4 py-3">{t('stockModule.colQty')}</th>
                <th className="px-4 py-3">{t('stockModule.colDispatched')}</th>
                <th className="px-4 py-3">{t('stockModule.colBarcode')}</th>
                <th className="px-4 py-3">{t('stockModule.colLocation')}</th>
                <th className="px-4 py-3 w-12 text-right font-medium normal-case" aria-label={t('stockModule.colActions')} />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={colCount} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    {t('common.loading')}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800/80"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.categoryName ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{p.stockQuantity}</td>
                    <td className="px-4 py-3 font-semibold text-amber-700 dark:text-amber-400">
                      {p.stockDispatched ?? 0}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {displayBarcode(p)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.storageLocation?.trim() || '—'}</td>
                    <td className="px-2 py-3 text-right">
                      <button
                        type="button"
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setRowMenu((cur) =>
                            cur?.product?.id === p.id ? null : { product: p, rect }
                          );
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {showEmptyHint && (
          <div className="flex items-start gap-3 border-t border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-100">
            <Info size={18} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
            <span>{t('stockModule.empty')}</span>
          </div>
        )}

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <StockProductsFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(defaultFilters);
          setApplied(defaultFilters);
          setPage(0);
          setFiltersOpen(false);
        }}
        onApply={() => {
          setApplied(filters);
          setPage(0);
          setFiltersOpen(false);
        }}
      />

      <WarehouseReceiveModal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onSaved={() => invalidateProductCaches(qc)}
      />

      {editProduct && (
        <ProductCatalogModal
          key={editProduct.id}
          product={editProduct}
          categories={categories}
          stores={stores}
          onClose={() => setEditProduct(null)}
          onSaved={() => {
            invalidateProductCaches(qc);
            setEditProduct(null);
          }}
        />
      )}

      {stockProduct && (
        <StockAdjustModal
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onSaved={() => {
            invalidateProductCaches(qc);
            setStockProduct(null);
          }}
        />
      )}

      <WarehouseReceiveModal
        open={!!receiveProduct}
        onClose={() => setReceiveProduct(null)}
        initialProduct={receiveProduct}
        onSaved={() => invalidateProductCaches(qc)}
      />

      <ProductInfoModal
        open={!!infoProductId}
        productId={infoProductId}
        onClose={() => setInfoProductId(null)}
        onEdit={(prod) => {
          if (!prod) return;
          setInfoProductId(null);
          setEditProduct(prod);
        }}
        onReceive={(prod) => {
          if (!prod) return;
          setInfoProductId(null);
          setReceiveProduct({ id: prod.id, name: prod.name });
        }}
        onDelete={(prod) => {
          if (!prod) return;
          setInfoProductId(null);
          setDeleteProduct(prod);
        }}
      />

      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('products.delete.title')}</h2>
              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
              {t('products.delete.hint', { name: deleteProduct.name })}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await productApi.deactivate(deleteProduct.id);
                    toast.success(t('products.deactivated'));
                    invalidateProductCaches(qc);
                    setDeleteProduct(null);
                  } catch (e) {
                    toast.error(e?.response?.data?.message ?? t('productModal.saveFailed'));
                  }
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t('products.rowDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rowMenu &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[80] cursor-default"
              aria-label="close menu"
              onClick={() => setRowMenu(null)}
            />
            <div
              role="menu"
              className="fixed z-[90] min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-xl dark:border-slate-700 dark:bg-slate-800"
              style={{
                top: `${rowMenu.rect.bottom + 4}px`,
                right: `${window.innerWidth - rowMenu.rect.right}px`,
              }}
            >
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  setInfoProductId(rowMenu.product.id);
                  setRowMenu(null);
                }}
              >
                {t('products.info.open')}
              </button>
              {manage && (
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => {
                    setEditProduct(rowMenu.product);
                    setRowMenu(null);
                  }}
                >
                  {t('products.rowEdit')}
                </button>
              )}
              {manage && (
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => {
                    setStockProduct(rowMenu.product);
                    setRowMenu(null);
                  }}
                >
                  {t('products.stockBtn')}
                </button>
              )}
              {manage && (
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => {
                    setReceiveProduct({ id: rowMenu.product.id, name: rowMenu.product.name });
                    setRowMenu(null);
                  }}
                >
                  {t('products.rowReceive')}
                </button>
              )}
              {manage && (
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30"
                  onClick={() => {
                    setDeleteProduct(rowMenu.product);
                    setRowMenu(null);
                  }}
                >
                  {t('products.rowDelete')}
                </button>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
