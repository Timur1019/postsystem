// src/pages/cashier/PosPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PosOrderDiscountModal from '../../components/cashier/PosOrderDiscountModal';
import PosReturnModal from '../../components/cashier/PosReturnModal';
import WeightEntryModal from '../../components/cashier/WeightEntryModal';
import PosRegisterWorkspace from '../../components/cashier/pos/PosRegisterWorkspace';
import PosShiftClosedBanner from '../../components/cashier/pos/PosShiftClosedBanner';
import { useCashierShift, useOpenCashierShift } from '../../hooks/useCashierShift';
import { useCashierStore } from '../../hooks/useCashierStore';
import { usePosCatalogViewMode } from '../../hooks/pos/usePosCatalogViewMode';
import { usePosProductsCatalog } from '../../hooks/pos/usePosProductsCatalog';
import { usePosNavigation } from '../../hooks/pos/usePosNavigation';
import { usePosCartHandlers } from '../../hooks/pos/usePosCartHandlers';
import { usePosCheckout } from '../../hooks/pos/usePosCheckout';
import { useCashierShiftModal } from '../../contexts/CashierShiftModalContext';
import { useCartStore } from '../../store/cartStore';

export default function PosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const searchInputRef = useRef(null);
  const { storeId, noAssignment, multipleAssignment } = useCashierStore();
  const [posPane, setPosPane] = useState('register');
  const [payOpen, setPayOpen] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const { open: shiftModalOpen, openShift: openShiftModal } = useCashierShiftModal();

  const items = useCartStore((s) => s.items);
  const addPieceItem = useCartStore((s) => s.addPieceItem);
  const addWeightLine = useCartStore((s) => s.addWeightLine);
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

  const { viewMode, handleViewModeChange } = usePosCatalogViewMode();
  const catalog = usePosProductsCatalog({ storeId, posPane });
  const {
    search,
    setSearch,
    setCatalogBrowse,
    setSelectedCategoryId,
    searchActive,
    products,
  } = catalog;

  const { handleClosePayment } = usePosNavigation({
    posPane,
    setPosPane,
    payOpen,
    setPayOpen,
    searchActive,
    viewMode,
    handleViewModeChange,
    catalogBrowse: catalog.catalogBrowse,
    setCatalogBrowse,
    setSelectedCategoryId,
    setSearch,
  });

  const { data: shift, isFetched: shiftFetched } = useCashierShift(storeId);
  const openShiftMutation = useOpenCashierShift(storeId);
  const shiftIsOpen = shift?.status === 'OPEN';
  const showShiftClosedBanner = Boolean(storeId && shiftFetched && !shiftIsOpen);

  const total = getTotal();
  const linesTotal = getLinesTotal();
  const orderDiscount = getOrderDiscount();
  const discountTotal = getDiscountTotal();

  const { checkoutMutation, handleConfirmPayment } = usePosCheckout({
    storeId,
    total,
    setPayOpen,
    setSelectedLineId,
  });

  const cartHandlers = usePosCartHandlers({
    storeId,
    shiftIsOpen,
    payOpen,
    returnOpen,
    shiftModalOpen,
    searchInputRef,
    products,
    search,
    setSearch,
    addPieceItem,
    addWeightLine,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    selectedLineId,
    setSelectedLineId,
  });

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

  const storeBlocked = noAssignment || multipleAssignment;
  const catalogProps = {
    storeId,
    viewMode,
    search: catalog.search,
    setSearch: catalog.setSearch,
    categories: catalog.categories,
    categoriesLoading: catalog.categoriesLoading,
    selectedCategoryId: catalog.selectedCategoryId,
    handleSelectCategory: catalog.handleSelectCategory,
    searchActive: catalog.searchActive,
    catalogBrowse: catalog.catalogBrowse,
    setCatalogBrowse: catalog.setCatalogBrowse,
    products: catalog.products,
    productsLoading: catalog.productsLoading,
    productsLoadingMore: catalog.productsLoadingMore,
    productsHasMore: catalog.productsHasMore,
    fetchMoreProducts: catalog.fetchMoreProducts,
    addProductToCart: cartHandlers.addProductToCart,
    handleSearchEnter: cartHandlers.handleSearchEnter,
  };

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
            <PosShiftClosedBanner
              t={t}
              openShiftMutation={openShiftMutation}
              onOpenShift={() =>
                openShiftMutation.mutate(undefined, {
                  onSuccess: () => toast.success(t('pos.shiftOpenedSuccess')),
                  onError: (e) => toast.error(e.response?.data?.message ?? t('pos.shiftOpenFailed')),
                })
              }
              onOpenShiftModal={openShiftModal}
            />
          ) : null}
          <PosRegisterWorkspace
            posPane={posPane}
            searchInputRef={searchInputRef}
            catalog={catalogProps}
            payOpen={payOpen}
            onClosePayment={handleClosePayment}
            cart={{
              items,
              total,
              selectedLineId,
              setSelectedLineId,
              handleQtyDelta: cartHandlers.handleQtyDelta,
              updateQuantity,
              updateUnitPrice,
              updateDiscountPercent,
              removeItem,
              clearCart,
              discountTotal,
            }}
            checkout={{ checkoutMutation, handleConfirmPayment }}
            shiftIsOpen={shiftIsOpen}
            onReturn={() => setReturnOpen(true)}
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
            t={t}
          />
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

      <WeightEntryModal
        open={!!cartHandlers.weightModalProduct}
        product={cartHandlers.weightModalProduct}
        unitPrice={cartHandlers.weightModalProduct?.sellingPrice}
        maxStock={cartHandlers.weightModalProduct?.stockQuantity}
        onConfirm={cartHandlers.handleWeightConfirm}
        onClose={cartHandlers.closeWeightModal}
      />
    </div>
  );
}
