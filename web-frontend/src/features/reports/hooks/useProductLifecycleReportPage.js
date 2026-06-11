import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../../../api';

export function useProductLifecycleReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const productIdFromUrl = searchParams.get('productId') || '';
  const [selectedId, setSelectedId] = useState(productIdFromUrl);

  useEffect(() => {
    if (productIdFromUrl) {
      setSelectedId(productIdFromUrl);
    }
  }, [productIdFromUrl]);

  const selectedProductQuery = useQuery({
    queryKey: ['product', selectedId],
    queryFn: () => productApi.getById(selectedId).then((r) => r.data),
    enabled: !!selectedId,
  });

  const selectProduct = (id) => {
    const nextId = id ? String(id) : '';
    setSelectedId(nextId);
    setSearchParams(nextId ? { productId: nextId } : {}, { replace: true });
  };

  const handleProductChange = (event) => {
    selectProduct(event.target.value);
  };

  return {
    selectedId,
    selectedProduct: selectedProductQuery.data,
    handleProductChange,
    selectProduct,
  };
}
