import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../../api';

export function useProductInfoModal({ open, productId, initialTab = 'details' }) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, productId, initialTab]);

  const { data: product, isPending, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getById(productId).then((r) => r.data),
    enabled: open && !!productId,
  });

  return {
    tab,
    setTab,
    product,
    isPending,
    isError,
  };
}
