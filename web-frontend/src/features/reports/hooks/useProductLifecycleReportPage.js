import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../../../api';

export function useProductLifecycleReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productIdFromUrl = searchParams.get('productId') || '';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedId, setSelectedId] = useState(productIdFromUrl);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (productIdFromUrl) {
      setSelectedId(productIdFromUrl);
    }
  }, [productIdFromUrl]);

  const searchQuery = useQuery({
    queryKey: ['product-lifecycle-search', debouncedSearch],
    queryFn: () =>
      productApi
        .getAll({ search: debouncedSearch, page: 0, size: 12, activeOnly: true })
        .then((r) => r.data),
    enabled: debouncedSearch.length >= 2,
    placeholderData: keepPreviousData,
  });

  const selectedProductQuery = useQuery({
    queryKey: ['product', selectedId],
    queryFn: () => productApi.getById(selectedId).then((r) => r.data),
    enabled: !!selectedId,
  });

  const candidates = useMemo(() => searchQuery.data?.content ?? [], [searchQuery.data]);

  const selectProduct = (id) => {
    setSelectedId(id);
    setPickerOpen(false);
    setSearch('');
    setDebouncedSearch('');
    setSearchParams(id ? { productId: id } : {}, { replace: true });
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPickerOpen(true);
  };

  return {
    search,
    debouncedSearch,
    selectedId,
    selectedProduct: selectedProductQuery.data,
    candidates,
    pickerOpen,
    setPickerOpen,
    searchLoading: searchQuery.isFetching,
    handleSearchChange,
    selectProduct,
  };
}
