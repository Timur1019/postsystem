// src/pages/cashier/PosPage.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ScanLine, Store, Clock } from 'lucide-react';
import { categoryApi, productApi, saleApi, cashierShiftApi } from '../../services/api';
import { useCartStore, lineDiscountAmount } from '../../store/cartStore';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { useCashierStore } from '../../hooks/useCashierStore';
import PosOrderPanel from '../../components/cashier/PosOrderPanel';
import PosCatalogPanel from '../../components/cashier/PosCatalogPanel';
import PosPaymentFlow from '../../components/cashier/PosPaymentFlow';
import PosReturnModal from '../../components/cashier/PosReturnModal';
import CashierShiftModal from '../../components/cashier/CashierShiftModal';
import '../../styles/pos.css';

const PRODUCT_PAGE_SIZE = 120;

export default function PosPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const barcodeRef = useRef(null);
  const scanningRef = useRef(false);
  const { storeId, storeName, storeLoading, noAssignment, multipleAssignment } = useCashierStore();
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

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
    if (!returnOpen && !payOpen && !shiftOpen && storeId) {
      const t = setTimeout(() => barcodeRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [returnOpen, payOpen, shiftOpen, storeId]);

  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
    enabled: !!storeId,
  });

  const searchActive = search.trim().length > 0;
  const categoryFilterId = searchActive ? undefined : selectedCategoryId ?? undefined;
  const showCategoryPicker = !searchActive && selectedCategoryId == null;

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
    enabled: !!storeId && (searchActive || selectedCategoryId != null),
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
    enabled: !!storeId && !payOpen && !shiftOpen && !returnOpen,
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
    onSuccess: (res) => {
      clearCart();
      setPayOpen(false);
      setSelectedLineId(null);
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      toast.success(t('pos.saleSuccess'));
      navigate(`/receipt/${res.data.receiptNumber}`);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pos.saleFailed')),
  });

  const handleQtyDelta = (productId, delta) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    updateQuantity(productId, item.quantity + delta);
  };

  const total = getTotal();
  const discountTotal = getDiscountTotal();
  const storeBlocked = noAssignment || multipleAssignment;
  const categoryName = categories.find((c) => c.id === selectedCategoryId)?.name ?? '';

  return (
    <div className="pos-shell pos-shell--register">
      <header className="pos-register-header">
        {storeId && (
          <div className="pos-toolbar__store-badge">
            <Store size={16} className="shrink-0 text-emerald-600" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">{t('pos.assignedStore')}</p>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {storeLoading ? t('common.loading') : storeName}
              </p>
            </div>
          </div>
        )}
        {shift && (
          <button type="button" className="pos-shift-badge" onClick={() => setShiftOpen(true)}>
            <Clock size={16} />
            <span>{shift.status === 'OPEN' ? t('pos.shiftOpen') : t('pos.shiftClosedLabel')}</span>
          </button>
        )}
        <div className="pos-toolbar__barcode pos-toolbar__barcode--compact">
          <ScanLine size={16} className="text-emerald-600" aria-hidden />
          <input
            ref={barcodeRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            disabled={!storeId}
            placeholder={t('pos.barcodePh')}
            autoComplete="off"
            className="pos-barcode-input"
          />
        </div>
      </header>

      {storeBlocked ? (
        <p className="pos-alert">{noAssignment ? t('pos.noStoreAssigned') : t('pos.multipleStoresAssigned')}</p>
      ) : !storeId ? (
        <p className="pos-alert">{t('common.loading')}</p>
      ) : (
        <div className="pos-page pos-page--register">
          <PosOrderPanel
            items={items}
            selectedLineId={selectedLineId}
            onSelectLine={setSelectedLineId}
            onQtyDelta={handleQtyDelta}
            onSetQuantity={updateQuantity}
            onUpdatePrice={updateUnitPrice}
            onUpdateLineSubtotal={updateLineSubtotal}
            onUpdateDiscountPercent={updateDiscountPercent}
            onRemove={removeItem}
            onClear={clearCart}
            onReturn={() => setReturnOpen(true)}
            total={total}
            discountTotal={discountTotal}
            itemCount={itemCount}
            onCheckout={() => setPayOpen(true)}
            checkoutDisabled={items.length === 0 || checkoutMutation.isPending || shift?.status !== 'OPEN'}
          />
          <PosCatalogPanel
            search={search}
            onSearchChange={setSearch}
            onSearchEnter={handleSearchEnter}
            categories={categories}
            categoriesLoading={categoriesLoading}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => {
              setSelectedCategoryId(id);
              setSearch('');
            }}
            onBackToCategories={() => setSelectedCategoryId(null)}
            showCategoryPicker={showCategoryPicker}
            searchActive={searchActive}
            products={products}
            productsLoading={productsLoading}
            categoryName={categoryName}
            onAddProduct={addProductToCart}
          />
        </div>
      )}

      <PosPaymentFlow
        open={payOpen}
        onClose={() => setPayOpen(false)}
        total={total}
        discountTotal={discountTotal}
        isPending={checkoutMutation.isPending}
        onConfirm={(payment) => checkoutMutation.mutate(payment)}
      />

      <PosReturnModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['sales-ledger'] });
          qc.invalidateQueries({ queryKey: ['my-sales'] });
          qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
        }}
      />

      <CashierShiftModal
        open={shiftOpen}
        onClose={() => setShiftOpen(false)}
        storeId={storeId}
        shift={shift}
      />
    </div>
  );
}
