import { useMemo, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { warehouseApi, productApi, categoryApi, storeApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { invalidateProductCaches } from '../../../utils/productCache';
import {
  STOCK_PAGE_SIZE_DEFAULT,
  STOCK_PRODUCT_DEFAULT_FILTERS,
  canManageStock,
} from '../constants';

export function useStockProductsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const manage = canManageStock(user?.role);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(STOCK_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [filters, setFilters] = useState(STOCK_PRODUCT_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(STOCK_PRODUCT_DEFAULT_FILTERS);

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

  const displayBarcode = useCallback((p) => {
    if (p.barcodes?.length) return p.barcodes[0];
    return p.barcode || '—';
  }, []);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(STOCK_PRODUCT_DEFAULT_FILTERS);
    setApplied(STOCK_PRODUCT_DEFAULT_FILTERS);
    setPage(0);
    setFiltersOpen(false);
  };

  const applyFilters = () => {
    setApplied(filters);
    setPage(0);
    setFiltersOpen(false);
  };

  const openRowMenu = (product, rect) => {
    setRowMenu((cur) => (cur?.product?.id === product.id ? null : { product, rect }));
  };

  const closeRowMenu = () => setRowMenu(null);

  const invalidateCaches = useCallback(() => invalidateProductCaches(qc), [qc]);

  const confirmDelete = async () => {
    if (!deleteProduct) return;
    try {
      await productApi.deactivate(deleteProduct.id);
      toast.success(t('products.deactivated'));
      invalidateCaches();
      setDeleteProduct(null);
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('productModal.saveFailed'));
    }
  };

  const errorMessage =
    error?.response?.data?.message ?? error?.message ?? t('stockModule.loadError');

  return {
    t,
    manage,
    search,
    page,
    pageSize,
    setPage,
    setPageSize,
    filtersOpen,
    setFiltersOpen,
    receiveOpen,
    setReceiveOpen,
    filters,
    setFilters,
    rowMenu,
    editProduct,
    setEditProduct,
    stockProduct,
    setStockProduct,
    receiveProduct,
    setReceiveProduct,
    deleteProduct,
    setDeleteProduct,
    infoProductId,
    setInfoProductId,
    rows,
    total,
    totalPages,
    loading,
    isError,
    errorMessage,
    showEmptyHint,
    categories,
    stores,
    displayBarcode,
    handleSearchChange,
    resetFilters,
    applyFilters,
    openRowMenu,
    closeRowMenu,
    invalidateCaches,
    confirmDelete,
  };
}
