import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { storeApi, warehouseApi } from '../../../api';
import { emptyTransferLine } from '../utils/stockDocumentFormUtils';

export function useStockTransferCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [lines, setLines] = useState([emptyTransferLine()]);

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const stores = storesQuery.data ?? [];

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createTransfer(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.transferCreated', { no: res.data.transferNumber }));
      navigate('/reports/stock/transfers');
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stockReports.transferFailed')),
  });

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyTransferLine()]);

  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const submit = () => {
    if (!fromStoreId || !toStoreId) {
      toast.error(t('stockReports.transferNeedStores'));
      return;
    }
    const payload = {
      fromStoreId: Number(fromStoreId),
      toStoreId: Number(toStoreId),
      lines: lines
        .filter((l) => l.productId)
        .map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
    };
    if (payload.lines.length === 0) {
      toast.error(t('stockReports.transferNeedLines'));
      return;
    }
    mutation.mutate(payload);
  };

  return {
    t,
    fromStoreId,
    setFromStoreId,
    toStoreId,
    setToStoreId,
    lines,
    stores,
    isPending: mutation.isPending,
    updateLine,
    addLine,
    removeLine,
    submit,
  };
}
