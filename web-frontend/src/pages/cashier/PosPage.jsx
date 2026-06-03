// src/pages/cashier/PosPage.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { usePosAutoPrint } from '../../contexts/PosAutoPrintContext';
import { isDesktopCashier } from '../../utils/printReceipt';
import { fmtMoney as fmt } from '../../utils/formatMoney';
import { clampPayAmount, round2 } from '../../utils/taxAmounts';
import { resolveProductUnitPrice } from '../../utils/productPrice';
import { categoryApi, productApi, saleApi } from '../../services/api';
import { useCashierShift, useOpenCashierShift } from '../../hooks/useCashierShift';
import { lineSubtotal, useCartStore } from '../../store/cartStore';
import PosOrderDiscountModal from '../../components/cashier/PosOrderDiscountModal';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { useCashierStore } from '../../hooks/useCashierStore';
import PosOrderPanel from '../../components/cashier/PosOrderPanel';
import PosCatalogPanel, { ALL_CATEGORY_ID } from '../../components/cashier/PosCatalogPanel';
import PosRegisterFooter from '../../components/cashier/PosRegisterFooter';
import PosPaymentFlow from '../../components/cashier/PosPaymentFlow';
import PosReturnModal from '../../components/cashier/PosReturnModal';
import { useCashierShiftModal } from '../../contexts/CashierShiftModalContext';
import { usePosShell } from '../../contexts/PosShellContext';
import { useCashierCompactLayout } from '../../hooks/useCashierCompactLayout';
import { DoorOpen } from 'lucide-react';

const VIEW_MODE_KEY = 'pos-catalog-view-mode';

function readViewMode() {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY);
    if (v === 'list' || v === 'grid') return v;
  } catch {
    /* ignore */
  }
  return 'grid';
}

const PRODUCT_PAGE_SIZE = 80;

export default function PosPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const searchInputRef = useRef(null);
  const scanningRef = useRef(false);
  const { storeId, noAssignment, multipleAssignment } = useCashierStore();
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_ID);
  const [catalogBrowse, setCatalogBrowse] = useState('categories');
  const [viewMode, setViewMode] = useState(readViewMode);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const { enqueueReceipt } = usePosAutoPrint();
  const [posPane, setPosPane] = useState('register');
  const { setShell } = usePosShell() ?? {};
  const { open: shiftModalOpen, openShift: openShiftModal } = useCashierShiftModal();
  const layoutCompact = useCashierCompactLayout();

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateUnitPrice = useCartStore((s) => s.updateUnitPrice);
  const updateDiscountPercent = useCartStore((s) => s.updateDiscountPercent);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);
  const getLinesTotal = useCartStore((s) => s.getLinesTotal);
  const getOrderDiscount = useCartStore((s) => s.getOrderDiscount);
  const getDiscountTotal = useCartStore((s) => s.getDiscountTotal);
  const setOrderDiscountAmount = useCartStore((s) => s.setOrderDiscountAmount);
  const setOrderDiscountPercent = useCartStore((s) => s.setOrderDiscountPercent);
  const clearOrderDiscount = useCartStore((s) => s.clearOrderDiscount);
  const getCheckoutLineItems = useCartStore((s) => s.getCheckoutLineItems);
  const getCheckoutOrderDiscountAmount = useCartStore((s) => s.getCheckoutOrderDiscountAmount);
  const getCheckoutOrderDiscountPercent = useCartStore((s) => s.getCheckoutOrderDiscountPercent);

  const { data: shift, isFetched: shiftFetched } = useCashierShift(storeId);
  const openShiftMutation = useOpenCashierShift(storeId);
  const shiftIsOpen = shift?.status === 'OPEN';
  const showShiftClosedBanner = Boolean(storeId && shiftFetched && !shiftIsOpen);

  useEffect(() => {
    if (storeId) searchInputRef.current?.focus();
  }, [storeId]);

  useEffect(() => {
    if (!returnOpen && !payOpen && storeId) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [returnOpen, payOpen, storeId]);

  useEffect(() => {
    if (payOpen) setPosPane('register');
  }, [payOpen]);

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

  const productsEnabled =
    !!storeId && posPane === 'catalog' && (searchActive || catalogBrowse === 'products');

  const {
    data: productsPages,
    isPending: productsLoading,
    isFetchingNextPage: productsLoadingMore,
    hasNextPage: productsHasMore,
    fetchNextPage: fetchMoreProducts,
  } = useInfiniteQuery({
    queryKey: ['pos-products', storeId, categoryFilterId, search.trim()],
    queryFn: ({ pageParam }) =>
      productApi
        .getAll({
          storeId,
          categoryId: categoryFilterId,
          search: search.trim() || undefined,
          page: pageParam,
          size: PRODUCT_PAGE_SIZE,
          activeOnly: true,
        })
        .then((r) => r.data),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = (lastPage?.number ?? 0) + 1;
      const total = lastPage?.totalPages ?? 0;
      return next < total ? next : undefined;
    },
    enabled: productsEnabled,
  });

  const products =
    productsPages?.pages.flatMap((page) => page?.content ?? []) ?? [];

  const handleSelectCategory = useCallback((id) => {
    setSelectedCategoryId(id);
    setSearch('');
    setCatalogBrowse('products');
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const handleGoToCatalog = useCallback(() => {
    setPayOpen(false);
    setPosPane('catalog');
    setCatalogBrowse('categories');
    setSelectedCategoryId(ALL_CATEGORY_ID);
    setSearch('');
  }, []);

  const handleClosePayment = useCallback(() => {
    setPayOpen(false);
  }, []);

  const handleGoToRegister = useCallback(() => {
    setPosPane('register');
    setSearch('');
  }, []);

  useEffect(() => {
    if (!setShell) return undefined;
    setShell({
      posPane,
      layoutCompact,
      payOpen,
      catalogBrowse,
      onGoToCatalog: handleGoToCatalog,
      onGoToRegister: handleGoToRegister,
      onClosePayment: handleClosePayment,
      searchActive,
      viewMode,
      onViewModeChange: handleViewModeChange,
    });
    return () => setShell(null);
  }, [
    setShell,
    posPane,
    catalogBrowse,
    handleGoToCatalog,
    handleGoToRegister,
    searchActive,
    viewMode,
    handleViewModeChange,
    layoutCompact,
    payOpen,
    handleClosePayment,
  ]);

  const addProductToCart = useCallback(
    (product) => {
      if (!shiftIsOpen) {
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
        costPrice: Number(product.costPrice ?? 0),
        sellingPrice: resolveProductUnitPrice(product, storeId),
        defaultDiscountPercent: Number(product.defaultDiscountPercent ?? 0),
        taxRate: Number(product.taxRate ?? 12),
        stockQuantity: product.stockQuantity,
      });
      const line = useCartStore.getState().items.find((i) => i.productId === product.id);
      if (line) {
        toast.success(
          <div className="pos-item-added-toast">
            <p className="pos-item-added-toast__name">{product.name}</p>
            <p className="pos-item-added-toast__sum">{fmt(lineSubtotal(line))}</p>
          </div>,
          {
            duration: 2600,
            className: 'pos-item-added-toast-host',
            ariaLabel: t('pos.itemAdded', {
              name: product.name,
              sum: fmt(lineSubtotal(line)),
            }),
          }
        );
      }
      setSelectedLineId(product.id);
    },
    [addItem, shiftIsOpen, storeId, t]
  );

  const tryAddByBarcode = useCallback(
    async (code, { silent = false } = {}) => {
      const trimmed = code.trim();
      if (!trimmed || !storeId || scanningRef.current || payOpen || returnOpen) return false;
      scanningRef.current = true;
      try {
        const res = await productApi.getByBarcode(trimmed, storeId);
        addProductToCart(res.data);
        setSearch('');
        return true;
      } catch (e) {
        if (!silent) toast.error(e.response?.data?.message ?? t('pos.barcodeNotFound'));
        return false;
      } finally {
        scanningRef.current = false;
        searchInputRef.current?.focus();
      }
    },
    [storeId, addProductToCart, payOpen, returnOpen, t]
  );

  useBarcodeScanner({
    enabled: !!storeId && !payOpen && !shiftModalOpen && !returnOpen,
    barcodeInputRef: searchInputRef,
    onScan: (code) => tryAddByBarcode(code),
    alwaysCapture: true,
  });

  const handleSearchEnter = useCallback(async () => {
    const q = search.trim();
    if (!q) return;
    if (await tryAddByBarcode(q, { silent: true })) return;
    if (products.length === 0) {
      toast.error(t('pos.barcodeNotFound'));
      return;
    }
    const lower = q.toLowerCase();
    const exact =
      products.find((p) => p.barcode?.toLowerCase() === lower) ||
      products.find((p) => p.sku?.toLowerCase() === lower) ||
      products.find((p) => p.name?.toLowerCase() === lower);
    addProductToCart(exact ?? products[0]);
    setSearch('');
  }, [search, products, tryAddByBarcode, addProductToCart, t]);

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
        items: getCheckoutLineItems(),
        orderDiscountAmount: getCheckoutOrderDiscountAmount(),
        orderDiscountPercent: getCheckoutOrderDiscountPercent(),
      }),
    onSuccess: async (res, payment) => {
      clearCart();
      setPayOpen(false);
      setSelectedLineId(null);
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      const receiptNum = res.data.receiptNumber;
      const shouldPrint = payment?.printReceipt !== false;
      toast.success(t('pos.saleSuccess'));
      if (shouldPrint) {
        if (isDesktopCashier()) {
          enqueueReceipt(res.data);
        } else {
          navigate(`/receipt/${receiptNum}`, {
            state: { autoPrint: true, fromCashier: true },
          });
        }
        return;
      }
      if (!isDesktopCashier()) {
        navigate(`/receipt/${receiptNum}`, { state: { fromCashier: true } });
      }
    },
    onError: (e) => {
      const msg = e.response?.data?.message ?? t('pos.saleFailed');
      toast.error(msg, { id: 'pos-checkout-error' });
    },
  });

  const handleConfirmPayment = (payment) => {
    if (checkoutMutation.isPending) return;
    const payTotal = round2(total);
    if (payment.paymentMethod === 'MIXED' && payment.cashAmount != null) {
      const cash = clampPayAmount(payment.cashAmount, payTotal);
      const card = round2(Math.max(0, payTotal - cash));
      checkoutMutation.mutate({
        ...payment,
        cashAmount: cash,
        cardAmount: card,
        amountTendered: payment.amountTendered ?? cash,
      });
      return;
    }
    checkoutMutation.mutate(payment);
  };

  const handleQtyDelta = (productId, delta) => {
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    updateQuantity(productId, item.quantity + delta);
  };

  const linesTotal = getLinesTotal();
  const orderDiscount = getOrderDiscount();
  const total = getTotal();
  const discountTotal = getDiscountTotal();
  const storeBlocked = noAssignment || multipleAssignment;
  return (
    <div className="cashier-register d-flex flex-column flex-grow-1 min-h-0">
      {storeBlocked ? (
        <div className="alert alert-warning mb-0">
          {noAssignment ? t('pos.noStoreAssigned') : t('pos.multipleStoresAssigned')}
        </div>
      ) : !storeId ? (
        <div className="alert alert-secondary mb-0">{t('common.loading')}</div>
      ) : (
        <>
          {showShiftClosedBanner ? (
            <div className="pos-shift-closed-banner mb-2 flex-shrink-0" role="status">
              <span className="pos-shift-closed-banner__text">{t('pos.shiftRequired')}</span>
              <div className="pos-shift-closed-banner__actions">
                <button
                  type="button"
                  className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
                  disabled={openShiftMutation.isPending}
                  onClick={() =>
                    openShiftMutation.mutate(undefined, {
                      onSuccess: () => toast.success(t('pos.shiftOpenedSuccess')),
                      onError: (e) => toast.error(e.response?.data?.message ?? t('pos.shiftOpenFailed')),
                    })
                  }
                >
                  <DoorOpen size={16} aria-hidden />
                  {t('pos.openShift')}
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={openShiftModal}>
                  {t('pos.navShift')}
                </button>
              </div>
            </div>
          ) : null}
          <div
            className={`cashier-register__split cashier-register__split--pane cashier-register__split--${posPane}`}
          >
            <div className="cashier-register__workspace">
              <div className="cashier-register__stage">
                <div className="cashier-register__catalog-col">
                  <PosCatalogPanel
                    ref={searchInputRef}
                    search={search}
                    onSearchChange={setSearch}
                    onSearchEnter={handleSearchEnter}
                    scanDisabled={!storeId}
                    categories={categories}
                    categoriesLoading={categoriesLoading}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={handleSelectCategory}
                    searchActive={searchActive}
                    catalogBrowse={catalogBrowse}
                    onBrowseChange={setCatalogBrowse}
                    products={products}
                    productsLoading={productsLoading}
                    productsLoadingMore={productsLoadingMore}
                    productsHasMore={Boolean(productsHasMore)}
                    onLoadMoreProducts={() => fetchMoreProducts()}
                    onAddProduct={addProductToCart}
                    viewMode={viewMode}
                  />
                </div>

                <div className="cashier-register__order-col">
                  <PosOrderPanel
                    variant="register"
                    showTotalsFoot={payOpen}
                    items={items}
                    total={total}
                    selectedLineId={selectedLineId}
                    onSelectLine={setSelectedLineId}
                    onQtyDelta={handleQtyDelta}
                    onUpdatePrice={updateUnitPrice}
                    onUpdateDiscountPercent={updateDiscountPercent}
                    onRemove={removeItem}
                  />
                </div>

                <aside
                  className={`cashier-register__actions-col${payOpen ? ' cashier-register__actions-col--pay' : ''}`}
                >
                  {payOpen ? (
                    <PosPaymentFlow
                      open
                      onClose={handleClosePayment}
                      total={total}
                      isPending={checkoutMutation.isPending}
                      onConfirm={handleConfirmPayment}
                    />
                  ) : (
                    <PosRegisterFooter
                      items={items}
                      total={total}
                      discountTotal={discountTotal}
                      onReturn={() => setReturnOpen(true)}
                      onClear={clearCart}
                      canClear={items.length > 0}
                      onDiscount={() => {
                        if (items.length === 0) {
                          toast.error(t('pos.cartEmpty'));
                          return;
                        }
                        setDiscountOpen(true);
                      }}
                      onCheckout={() => {
                        setPosPane('register');
                        setPayOpen(true);
                      }}
                      checkoutDisabled={
                        items.length === 0 || checkoutMutation.isPending || !shiftIsOpen
                      }
                    />
                  )}
                </aside>
              </div>
            </div>
          </div>
        </>
      )}

      <PosReturnModal
        terminal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['sales-ledger'] });
          qc.invalidateQueries({ queryKey: ['my-sales'] });
          qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
        }}
      />

      <PosOrderDiscountModal
        terminal
        open={discountOpen}
        onClose={() => setDiscountOpen(false)}
        linesTotal={linesTotal}
        orderDiscount={orderDiscount}
        onApplyAmount={setOrderDiscountAmount}
        onApplyPercent={setOrderDiscountPercent}
        onClear={clearOrderDiscount}
      />

    </div>
  );
}
