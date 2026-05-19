// src/pages/cashier/PosPage.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { printReceiptAfterSale } from '../../utils/printReceipt';
import { categoryApi, productApi, saleApi, cashierShiftApi } from '../../services/api';
import { useCartStore, lineDiscountAmount } from '../../store/cartStore';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { useCashierStore } from '../../hooks/useCashierStore';
import PosOrderPanel from '../../components/cashier/PosOrderPanel';
import PosCatalogPanel, { ALL_CATEGORY_ID } from '../../components/cashier/PosCatalogPanel';
import PosPaymentFlow from '../../components/cashier/PosPaymentFlow';
import PosReturnModal from '../../components/cashier/PosReturnModal';
import { useCashierShiftModal } from '../../contexts/CashierShiftModalContext';

const PRODUCT_PAGE_SIZE = 120;

export default function PosPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const barcodeRef = useRef(null);
  const scanningRef = useRef(false);
  const { storeId, noAssignment, multipleAssignment } = useCashierStore();
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_ID);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const { open: shiftModalOpen } = useCashierShiftModal();

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateUnitPrice = useCartStore((s) => s.updateUnitPrice);
  const updateLineSubtotal = useCartStore((s) => s.updateLineSubtotal);
  const updateDiscountPercent = useCartStore((s) => s.updateDiscountPercent);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);
  const getDiscountTotal = useCartStore((s) => s.getDiscountTotal);
  const itemCount = useCartStore((s) => s.itemCount);

  const { data: shift, isError: shiftError } = useQuery({
    queryKey: ['cashier-shift', storeId],
    queryFn: () => cashierShiftApi.current(storeId).then((r) => r.data),
    enabled: !!storeId,
    retry: 1,
  });

  useEffect(() => {
    if (shiftError) {
      toast.error(t('pos.shiftOpenFailed'));
    }
  }, [shiftError, t]);

  useEffect(() => {
    if (storeId) barcodeRef.current?.focus();
  }, [storeId]);

  useEffect(() => {
    if (!returnOpen && !payOpen && storeId) {
      const timer = setTimeout(() => barcodeRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [returnOpen, payOpen, storeId]);

  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
    enabled: !!storeId,
  });

  const searchActive = search.trim().length > 0;
  const categoryFilterId =
    searchActive || selectedCategoryId === ALL_CATEGORY_ID
      ? undefined
      : selectedCategoryId;

  const { data: productsData, isPending: productsLoading } = useQuery({
    queryKey: ['pos-products', storeId, categoryFilterId, search],
    queryFn: () =>
      productApi
        .getAll({
          storeId,
          categoryId: categoryFilterId,
          search: search.trim() || undefined,
          page: 0,
          size: PRODUCT_PAGE_SIZE,
          activeOnly: true,
        })
        .then((r) => r.data),
    enabled: !!storeId,
  });

  const products = productsData?.content ?? [];

  const addProductToCart = useCallback(
    (product) => {
      if (!shift || shift.status !== 'OPEN') {
        toast.error(t('pos.shiftRequired'));
        return;
      }
      if (!product.active) {
        toast.error(t('pos.productInactive'));
        return;
      }
      if (product.stockQuantity <= 0) {
        toast.error(t('pos.outOfStock'));
        return;
      }
      addItem({
        id: product.id,
        name: product.name,
        sku: product.sku,
        sellingPrice: Number(product.sellingPrice),
        defaultDiscountPercent: Number(product.defaultDiscountPercent ?? 0),
        taxRate: Number(product.taxRate ?? 12),
        stockQuantity: product.stockQuantity,
      });
      setSelectedLineId(product.id);
    },
    [addItem, shift, t]
  );

  const resolveBarcode = useCallback(
    async (code) => {
      const trimmed = code.trim();
      if (!trimmed || !storeId || scanningRef.current || payOpen || returnOpen) return;
      scanningRef.current = true;
      try {
        const res = await productApi.getByBarcode(trimmed, storeId);
        addProductToCart(res.data);
        toast.success(t('pos.barcodeAdded', { name: res.data.name }));
        setBarcode('');
      } catch (e) {
        toast.error(e.response?.data?.message ?? t('pos.barcodeNotFound'));
      } finally {
        scanningRef.current = false;
        barcodeRef.current?.focus();
      }
    },
    [storeId, addProductToCart, payOpen, returnOpen, t]
  );

  useBarcodeScanner({
    enabled: !!storeId && !payOpen && !shiftModalOpen && !returnOpen,
    barcodeInputRef: barcodeRef,
    onScan: resolveBarcode,
    alwaysCapture: true,
  });

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault();
      resolveBarcode(barcode);
    }
  };

  const handleSearchEnter = useCallback(() => {
    if (!searchActive || products.length === 0) return;
    const q = search.trim().toLowerCase();
    const exact =
      products.find((p) => p.barcode?.toLowerCase() === q) ||
      products.find((p) => p.sku?.toLowerCase() === q) ||
      products.find((p) => p.name?.toLowerCase() === q);
    addProductToCart(exact ?? products[0]);
    setSearch('');
  }, [searchActive, products, search, addProductToCart]);

  const checkoutMutation = useMutation({
    mutationFn: (payment) =>
      saleApi.create({
        storeId: Number(storeId),
        paymentMethod: payment.paymentMethod,
        receiptType: payment.receiptType,
        cardType: payment.cardType,
        cashAmount: payment.cashAmount,
        cardAmount: payment.cardAmount,
        amountTendered: payment.amountTendered,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          discount: lineDiscountAmount(i),
        })),
      }),
    onSuccess: async (res) => {
      clearCart();
      setPayOpen(false);
      setSelectedLineId(null);
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      const receiptNum = res.data.receiptNumber;
      try {
        const mode = await printReceiptAfterSale(receiptNum);
        if (mode === 'silent') {
          toast.success(t('pos.saleSuccess'));
          return;
        }
      } catch (e) {
        toast.error(e?.message ?? t('pos.printFailed'));
      }
      toast.success(t('pos.saleSuccess'));
      navigate(`/receipt/${receiptNum}`, {
        state: { autoPrint: true, fromCashier: true },
      });
    },
    onError: (e) => {
      const msg = e.response?.data?.message ?? t('pos.saleFailed');
      toast.error(msg, { id: 'pos-checkout-error' });
    },
  });

  const handleConfirmPayment = (payment) => {
    if (checkoutMutation.isPending) return;
    if (
      payment.paymentMethod === 'MIXED' &&
      payment.cashAmount != null &&
      Number(payment.cashAmount) > total + 0.001
    ) {
      toast.error(t('pos.mixedCashExceeds'), { id: 'mixed-cash-exceed' });
      return;
    }
    checkoutMutation.mutate(payment);
  };

  const handleQtyDelta = (productId, delta) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    updateQuantity(productId, item.quantity + delta);
  };

  const total = getTotal();
  const discountTotal = getDiscountTotal();
  const storeBlocked = noAssignment || multipleAssignment;
  return (
    <div className="cashier-register d-flex flex-column flex-grow-1 min-h-0">
      <input
        ref={barcodeRef}
        type="text"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={handleBarcodeKeyDown}
        disabled={!storeId}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden
        className="pos-barcode-hidden"
      />

      {storeBlocked ? (
        <div className="alert alert-warning mb-0">
          {noAssignment ? t('pos.noStoreAssigned') : t('pos.multipleStoresAssigned')}
        </div>
      ) : !storeId ? (
        <div className="alert alert-secondary mb-0">{t('common.loading')}</div>
      ) : (
        <div className="cashier-register__split">
            <div className="cashier-register__left">
              <PosOrderPanel
                className={payOpen ? 'is-slide-away' : ''}
                items={items}
                selectedLineId={selectedLineId}
                onSelectLine={setSelectedLineId}
                onQtyDelta={handleQtyDelta}
                onUpdatePrice={updateUnitPrice}
                onUpdateDiscountPercent={updateDiscountPercent}
                onRemove={removeItem}
                onClear={clearCart}
                onReturn={() => setReturnOpen(true)}
                total={total}
                discountTotal={discountTotal}
                onCheckout={() => setPayOpen(true)}
                checkoutDisabled={items.length === 0 || checkoutMutation.isPending || shift?.status !== 'OPEN'}
              />
              <PosPaymentFlow
                open={payOpen}
                onClose={() => setPayOpen(false)}
                items={items}
                total={total}
                discountTotal={discountTotal}
                isPending={checkoutMutation.isPending}
                onConfirm={handleConfirmPayment}
              />
            </div>
            <PosCatalogPanel
              search={search}
              onSearchChange={setSearch}
              onSearchEnter={handleSearchEnter}
              scanDisabled={!storeId}
              onBarcodeFocus={() => barcodeRef.current?.focus()}
              categories={categories}
              categoriesLoading={categoriesLoading}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={(id) => {
                setSelectedCategoryId(id);
                setSearch('');
              }}
              searchActive={searchActive}
              products={products}
              productsLoading={productsLoading}
              onAddProduct={addProductToCart}
            />
        </div>
      )}

      <PosReturnModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['sales-ledger'] });
          qc.invalidateQueries({ queryKey: ['my-sales'] });
          qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
        }}
      />

    </div>
  );
}
