import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { emptyInventoryLine } from '../utils/stockDocumentFormUtils';

export function useStockInventoryCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [storeId, setStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyInventoryLine()]);
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  useEffect(() => {
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createInventory(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.inventoryCreated', { no: res.data.inventoryNumber }));
      invalidateProductCaches(qc);
      navigate('/reports/stock/inventories');
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stockReports.inventoryFailed')),
  });

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyInventoryLine()]);

  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const submit = () => {
    const sid = resolveStoreId(storeId);
    if (!sid) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    const payload = {
      storeId: sid,
      notes: notes.trim() || undefined,
      lines: lines
        .filter((l) => l.productId)
        .map((l) => ({
          productId: l.productId,
          countedQuantity: Number(l.countedQuantity),
        })),
    };
    if (payload.lines.length === 0) {
      toast.error(t('stockReports.inventoryNeedLines'));
      return;
    }
    mutation.mutate(payload);
  };

  return {
    t,
    storeId,
    setStoreId,
    notes,
    setNotes,
    lines,
    stores,
    needsStorePick,
    effectiveStoreId,
    isPending: mutation.isPending,
    updateLine,
    addLine,
    removeLine,
    submit,
  };
}
