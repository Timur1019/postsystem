// src/pages/ProductsPage.jsx
import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, MoreVertical, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi, categoryApi, storeApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import ProductCatalogModal from '../components/products/ProductCatalogModal';
import StockAdjustModal from '../components/products/StockAdjustModal';
import ProductsToolbar from '../components/products/ProductsToolbar';
import ProductFiltersDrawer from '../components/products/ProductFiltersDrawer';
import ProductBulkVatModal from '../components/products/ProductBulkVatModal';
import ProductBulkDeleteModal from '../components/products/ProductBulkDeleteModal';
import ProductImportModal from '../components/products/ProductImportModal';
import ProductExportModal from '../components/products/ProductExportModal';
import WarehouseReceiveModal from '../components/stock/WarehouseReceiveModal';
import ProductInfoModal from '../components/products/ProductInfoModal';
import { invalidateProductCaches } from '../utils/productCache';
import { fmtMoney as fmtNum } from '../utils/formatMoney';
import TablePagination from '../components/shared/TablePagination';

const defaultFilters = {
  ikpuStatus: 'ALL',
  storeId: '',
  barcode: '',
  categoryId: '',
  soldIndividually: '',
  markedProduct: '',
  deletedScope: 'ACTIVE',
};

const canManage = (role) => role === 'ADMIN' || role === 'MANAGER';

export default function ProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const manage = canManage(user?.role);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [editProduct, setEditProduct] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkVatOpen, setBulkVatOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  /** Row actions menu: portal + fixed coords so overflow on table does not clip the dropdown. */
  const [rowMenu, setRowMenu] = useState(null);
  const [receiveProduct, setReceiveProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [infoProductId, setInfoProductId] = useState(null);
  const [infoTab, setInfoTab] = useState('details');
  const selectAllRef = useRef(null);

  const queryParams = useMemo(() => {
    const af = appliedFilters;
    return {
      search: search.trim() || undefined,
      page,
      size: pageSize,
      activeOnly: af.deletedScope === 'ACTIVE',
      deletedScope: af.deletedScope === 'ACTIVE' ? undefined : af.deletedScope,
      categoryId: af.categoryId === '' ? undefined : Number(af.categoryId),
      storeId: af.storeId === '' ? undefined : Number(af.storeId),
      ikpuStatus: af.ikpuStatus === 'ALL' ? undefined : af.ikpuStatus,
      markedProduct:
        af.markedProduct === '' ? undefined : af.markedProduct === 'true',
      soldIndividually:
        af.soldIndividually === '' ? undefined : af.soldIndividually === 'true',
      barcode: af.barcode.trim() || undefined,
    };
  }, [search, page, pageSize, appliedFilters]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productApi.getAll(queryParams).then((r) => r.data),
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

  const pageIds = useMemo(() => (data?.content ?? []).map((p) => p.id), [data?.content]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

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
  }, [page, search]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => n.delete(id));
      } else {
        pageIds.forEach((id) => n.add(id));
      }
      return n;
    });
  };

  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('products.title')}</h1>
        </div>
        <ProductsToolbar
          canManage={manage}
          onAdd={() => setShowCreate(true)}
          onImport={() => setImportOpen(true)}
          onExport={() => setExportOpen(true)}
          onBulkVat={() => {
            if (selectedIds.size === 0) {
              toast.error(t('products.bulkVat.noneSelected'));
              return;
            }
            setBulkVatOpen(true);
          }}
          onDeleteAll={() => {
            if (selectedIds.size === 0) {
              toast.error(t('products.bulkDelete.noneSelected'));
              return;
            }
            setBulkDeleteOpen(true);
          }}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={t('products.searchNamePh')}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:text-slate-500">
                <th className="px-3 py-3 w-10">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllPage}
                    className="rounded border-slate-400 dark:border-slate-600"
                  />
                </th>
                <th className="px-3 py-3 font-medium">{t('products.colIkpuId')}</th>
                <th className="px-3 py-3 font-medium">{t('products.colName')}</th>
                <th className="px-3 py-3 font-medium">{t('products.colCategory')}</th>
                <th className="px-3 py-3 font-medium text-right">{t('products.colPrices')}</th>
                <th className="px-3 py-3 font-medium text-right">{t('products.colVat')}</th>
                <th className="px-3 py-3 font-medium">{t('products.colMarking')}</th>
                <th className="px-3 py-3 font-medium text-center">{t('products.colStores')}</th>
                <th className="px-3 py-3 font-medium text-right">{t('products.colStock')}</th>
                <th className="px-3 py-3 font-medium text-right">{t('products.colDispatched')}</th>
                <th className="px-3 py-3 font-medium w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : data?.content?.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    {t('products.none')}
                  </td>
                </tr>
              ) : (
                data.content.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-slate-400 dark:border-slate-600"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs leading-tight text-slate-700 dark:text-slate-300">
                        {p.ikpu ? <span>{p.ikpu}</span> : <span className="text-slate-400 dark:text-slate-600">—</span>}
                        <div className="max-w-[140px] break-all text-[11px] text-slate-500 dark:text-slate-500">{p.id}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{p.categoryName ?? '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                      {fmtNum(p.sellingPrice)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {p.taxRate != null ? `${Number(p.taxRate)}%` : '—'}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                      {p.markedProduct ? t('products.markingYes') : '—'}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300">{p.storesCount ?? 0}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`font-semibold ${p.lowStock ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {p.stockQuantity}
                        {p.lowStock && <AlertTriangle size={12} className="inline ml-1" />}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-amber-700 dark:text-amber-400">
                      {p.stockDispatched ?? 0}
                    </td>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {(showCreate || editProduct) && (
        <ProductCatalogModal
          key={editProduct?.id ?? 'new'}
          product={editProduct}
          categories={categories}
          stores={stores}
          onClose={() => {
            setShowCreate(false);
            setEditProduct(null);
          }}
          onSaved={() => {
            invalidateProductCaches(qc);
            setShowCreate(false);
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

      <ProductFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        categories={categories}
        stores={stores}
        onReset={() => {
          const f = { ...defaultFilters };
          setFilters(f);
          setAppliedFilters(f);
          setPage(0);
        }}
        onApply={() => {
          setAppliedFilters({ ...filters });
          setPage(0);
          setFiltersOpen(false);
        }}
      />

      {bulkVatOpen && (
        <ProductBulkVatModal
          productIds={selectedIds}
          onClose={() => setBulkVatOpen(false)}
          onDone={() => {
            setBulkVatOpen(false);
            setSelectedIds(new Set());
          }}
        />
      )}
      {bulkDeleteOpen && (
        <ProductBulkDeleteModal
          productIds={selectedIds}
          onClose={() => setBulkDeleteOpen(false)}
          onDone={() => {
            setBulkDeleteOpen(false);
            setSelectedIds(new Set());
          }}
        />
      )}
      {importOpen && (
        <ProductImportModal
          categories={categories}
          stores={stores}
          onClose={() => {
            setImportOpen(false);
            invalidateProductCaches(qc);
          }}
        />
      )}
      {exportOpen && <ProductExportModal stores={stores} onClose={() => setExportOpen(false)} />}

      <WarehouseReceiveModal
        open={!!receiveProduct}
        onClose={() => setReceiveProduct(null)}
        initialProduct={receiveProduct}
        onSaved={() => invalidateProductCaches(qc)}
      />

      <ProductInfoModal
        open={!!infoProductId}
        productId={infoProductId}
        initialTab={infoTab}
        onClose={() => setInfoProductId(null)}
        onEdit={(p) => {
          if (!p) return;
          setInfoProductId(null);
          setEditProduct(p);
        }}
        onReceive={(p) => {
          if (!p) return;
          setInfoProductId(null);
          setReceiveProduct({ id: p.id, name: p.name });
        }}
        onDelete={(p) => {
          if (!p) return;
          setInfoProductId(null);
          setDeleteProduct(p);
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
                  setInfoTab('details');
                  setInfoProductId(rowMenu.product.id);
                  setRowMenu(null);
                }}
              >
                {t('products.info.open')}
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  setInfoTab('lifecycle');
                  setInfoProductId(rowMenu.product.id);
                  setRowMenu(null);
                }}
              >
                {t('products.info.openLifecycle')}
              </button>
              {manage && (
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => {
                    navigate(`/reports/stock/lifecycle?productId=${rowMenu.product.id}`);
                    setRowMenu(null);
                  }}
                >
                  {t('products.rowLifecycleReport')}
                </button>
              )}
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
