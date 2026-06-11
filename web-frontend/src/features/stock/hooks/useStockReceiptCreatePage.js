import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productApi, supplierApi, warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { emptyReceiptLine } from '../utils/stockDocumentFormUtils';

export function useStockReceiptCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [lines, setLines] = useState([emptyReceiptLine()]);
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  useEffect(() => {
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  const productsQuery = useQuery({
    queryKey: ['products-receipt-pick', effectiveStoreId],
    queryFn: () =>
      productApi
        .getAll({
          page: 0,
          size: 500,
          activeOnly: true,
          ...(effectiveStoreId ? { storeId: effectiveStoreId } : {}),
        })
        .then((r) => r.data),
    enabled: !needsStorePick || !!effectiveStoreId,
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.getAll({ page: 0, size: 200 }).then((r) => r.data),
  });

  const catalog = productsQuery.data?.content ?? [];
  const supplierList = suppliersQuery.data?.content ?? [];

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createReceipt(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.receiptCreated', { no: res.data.receiptNumber }));
      invalidateProductCaches(qc);
      navigate('/reports/stock/receipts');
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stockReports.receiptFailed')),
  });

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const onProductPick = (idx, productId) => {
    const product = catalog.find((x) => x.id === productId);
    if (!product) return;
    updateLine(idx, {
      productId,
      purchasePrice: String(product.costPrice ?? ''),
      unitSellingPrice: String(product.sellingPrice ?? ''),
    });
  };

  const addLine = () => setLines((prev) => [...prev, emptyReceiptLine()]);

  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const submit = () => {
    const sid = resolveStoreId(storeId);
    if (!sid) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    const payload = {
      supplierId: supplierId || undefined,
      storeId: sid,
      notes: notes.trim() || undefined,
      paymentType,
      lines: lines
        .filter((l) => l.productId)
        .map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          purchasePrice: Number(l.purchasePrice),
          unitSellingPrice: Number(l.unitSellingPrice),
        })),
    };
    if (payload.lines.length === 0) {
      toast.error(t('stockReports.receiptNeedLines'));
      return;
    }
    if (paymentType === 'CREDIT' && !supplierId) {
      toast.error(t('stockReports.receiptCreditNeedsSupplier'));
      return;
    }
    mutation.mutate(payload);
  };

  return {
    t,
    supplierId,
    setSupplierId,
    storeId,
    setStoreId,
    notes,
    setNotes,
    paymentType,
    setPaymentType,
    lines,
    stores,
    needsStorePick,
    catalog,
    supplierList,
    isPending: mutation.isPending,
    updateLine,
    onProductPick,
    addLine,
    removeLine,
    submit,
  };
}
