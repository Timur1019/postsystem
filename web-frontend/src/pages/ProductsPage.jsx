// src/pages/ProductsPage.jsx
import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi, categoryApi, storeApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useTenantScope } from '../hooks/useTenantScope';
import ProductCatalogModal from '../components/products/ProductCatalogModal';
import {
  isUniversalStoreType,
  listTemplatesForBusinessType,
  resolveBusinessTypeForTemplates,
} from '../config/productCatalogTemplateRegistry';
import StockAdjustModal from '../components/products/StockAdjustModal';
import ProductsToolbar from '../components/products/ProductsToolbar';
import ProductFiltersDrawer from '../components/products/ProductFiltersDrawer';
import ProductBulkVatModal from '../components/products/ProductBulkVatModal';
import ProductBulkDeleteModal from '../components/products/ProductBulkDeleteModal';
import ProductImportModal from '../components/products/ProductImportModal';
import ProductExportModal from '../components/products/ProductExportModal';
import WarehouseReceiveModal from '../components/stock/WarehouseReceiveModal';
import ProductInfoModal from '../components/products/ProductInfoModal';
import ProductsTable from '../components/products/ProductsTable';
import ProductRowActionsMenu from '../components/products/ProductRowActionsMenu';
import ProductDeleteConfirmModal from '../components/products/ProductDeleteConfirmModal';
import { invalidateProductCaches } from '../utils/productCache';

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
  const { tenantKey, tenantReady } = useTenantScope();
  const manage = canManage(user?.role);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);
  const [editProduct, setEditProduct] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStore, setCreateStore] = useState(null);
  const [createTemplateCode, setCreateTemplateCode] = useState(null);
  const [createAdvancedMode, setCreateAdvancedMode] = useState(false);
  const [createUniversalMode, setCreateUniversalMode] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkVatOpen, setBulkVatOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
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
    queryKey: tenantKey('products', queryParams),
    queryFn: () => productApi.getAll(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: tenantReady,
  });

  const { data: categories = [] } = useQuery({
    queryKey: tenantKey('categories'),
    queryFn: () => categoryApi.getAll().then((r) => r.data),
    enabled: tenantReady,
  });

  const { data: stores = [] } = useQuery({
    queryKey: tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: tenantReady,
  });

  const activeStores = useMemo(
    () => (stores ?? []).filter((s) => s.active !== false),
    [stores]
  );

  const defaultTemplateForStore = (store) => {
    const templates = listTemplatesForBusinessType(store.businessType);
    return templates[0]?.code ?? null;
  };

  const resetCreateFlow = () => {
    setShowCreate(false);
    setCreateStore(null);
    setCreateTemplateCode(null);
    setCreateAdvancedMode(false);
    setCreateUniversalMode(false);
  };

  const startCreateFlow = (store) => {
    setCreateStore(store);
    if (isUniversalStoreType(store.businessType)) {
      setCreateTemplateCode(null);
      setCreateAdvancedMode(false);
      setCreateUniversalMode(true);
    } else {
      setCreateUniversalMode(false);
      setCreateAdvancedMode(false);
      setCreateTemplateCode(defaultTemplateForStore(store));
    }
    setShowCreate(true);
  };

  const handleAddProduct = () => {
    if (activeStores.length === 0) {
      toast.error(t('productTemplates.noStoresHint'));
      return;
    }
    resetCreateFlow();
    startCreateFlow(activeStores[0]);
  };

  const handleCreateStoreChange = (store) => {
    if (!createStore || !store || store.id === createStore.id) return;
    const prevUniversal = isUniversalStoreType(createStore.businessType);
    const nextUniversal = isUniversalStoreType(store.businessType);
    setCreateStore(store);

    if (prevUniversal && nextUniversal) return;

    if (nextUniversal) {
      setCreateTemplateCode(null);
      setCreateAdvancedMode(false);
      setCreateUniversalMode(true);
      return;
    }

    const prevType = resolveBusinessTypeForTemplates(createStore.businessType);
    const nextType = resolveBusinessTypeForTemplates(store.businessType);
    if (prevUniversal || prevType !== nextType) {
      setCreateTemplateCode(defaultTemplateForStore(store));
      setCreateAdvancedMode(false);
      setCreateUniversalMode(false);
      if (!prevUniversal) toast(t('productTemplates.storeTypeChanged'));
    }
  };

  const handleCreateTemplateChange = (value) => {
    if (value === '__advanced__') {
      setCreateTemplateCode(null);
      setCreateAdvancedMode(true);
      setCreateUniversalMode(false);
      return;
    }
    setCreateTemplateCode(value);
    setCreateAdvancedMode(false);
    setCreateUniversalMode(false);
  };

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
          onAdd={handleAddProduct}
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

      <ProductsTable
        t={t}
        isLoading={isLoading}
        data={data}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        allPageSelected={allPageSelected}
        somePageSelected={somePageSelected}
        toggleSelectAllPage={toggleSelectAllPage}
        selectAllRef={selectAllRef}
        onOpenRowMenu={(product, rect) =>
          setRowMenu((cur) => (cur?.product?.id === product.id ? null : { product, rect }))
        }
      />

      {(showCreate || editProduct) && (
        <ProductCatalogModal
          key={
            editProduct?.id
            ?? `new-${createStore?.id ?? 'x'}-${createUniversalMode ? 'universal' : createTemplateCode ?? 'advanced'}-${createAdvancedMode ? 'adv' : 'tpl'}`
          }
          product={editProduct}
          categories={categories}
          stores={activeStores}
          selectedStore={editProduct ? null : createStore}
          templateCode={editProduct ? null : createTemplateCode}
          advancedMode={!editProduct && createAdvancedMode}
          universalMode={!editProduct && createUniversalMode}
          onCreateStoreChange={handleCreateStoreChange}
          onCreateTemplateChange={handleCreateTemplateChange}
          onClose={() => {
            if (editProduct) {
              setEditProduct(null);
            } else {
              resetCreateFlow();
            }
          }}
          onSaved={() => {
            invalidateProductCaches(qc);
            setEditProduct(null);
            resetCreateFlow();
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

      <ProductDeleteConfirmModal
        product={deleteProduct}
        t={t}
        onClose={() => setDeleteProduct(null)}
        onDeleted={() => {
          invalidateProductCaches(qc);
          setDeleteProduct(null);
        }}
      />

      <ProductRowActionsMenu
        rowMenu={rowMenu}
        manage={manage}
        t={t}
        onClose={() => setRowMenu(null)}
        onOpenInfo={(p) => {
          setInfoTab('details');
          setInfoProductId(p.id);
          setRowMenu(null);
        }}
        onOpenLifecycle={(p) => {
          setInfoTab('lifecycle');
          setInfoProductId(p.id);
          setRowMenu(null);
        }}
        onLifecycleReport={(p) => {
          navigate(`/reports/stock/lifecycle?productId=${p.id}`);
          setRowMenu(null);
        }}
        onEdit={(p) => {
          setEditProduct(p);
          setRowMenu(null);
        }}
        onAdjustStock={(p) => {
          setStockProduct(p);
          setRowMenu(null);
        }}
        onReceive={(p) => {
          setReceiveProduct({ id: p.id, name: p.name });
          setRowMenu(null);
        }}
        onDelete={(p) => {
          setDeleteProduct(p);
          setRowMenu(null);
        }}
      />
    </div>
  );
}
