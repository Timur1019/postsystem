import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productApi } from '../../services/api';
import { useBarcodeScanner } from '../useBarcodeScanner';
import { lineSubtotal, useCartStore } from '../../store/cartStore';
import { fmtMoney as fmt } from '../../utils/formatMoney';
import { isWeightProduct, roundQty } from '../../utils/quantityFormat';

const WEIGHT_QTY_STEP = 0.1;
const MIN_WEIGHT_KG = 0.001;
import { resolveProductUnitPrice } from '../../utils/productPrice';

export function usePosCartHandlers({
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
  removeItem,
  selectedLineId,
  setSelectedLineId,
}) {
  const { t } = useTranslation();
  const scanningRef = useRef(false);
  const [weightModalProduct, setWeightModalProduct] = useState(null);
  const [weightEditLineId, setWeightEditLineId] = useState(null);

  const cartProductPayload = useCallback(
    (product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      saleType: product.saleType || 'PIECE',
      unitCode: product.unitCode,
      quantityScale: product.quantityScale,
      allowFraction: product.allowFraction,
      costPrice: Number(product.costPrice ?? 0),
      sellingPrice: resolveProductUnitPrice(product, storeId),
      defaultDiscountPercent: Number(product.defaultDiscountPercent ?? 0),
      taxRate: Number(product.taxRate ?? 12),
      stockQuantity: Number(product.stockQuantity ?? 0),
    }),
    [storeId]
  );

  const showLineAddedToast = useCallback(
    (line, productName) => {
      toast.success(
        <div className="pos-item-added-toast">
          <p className="pos-item-added-toast__name">{productName}</p>
          <p className="pos-item-added-toast__sum">{fmt(lineSubtotal(line))}</p>
        </div>,
        {
          duration: 2600,
          className: 'pos-item-added-toast-host',
          ariaLabel: t('pos.itemAdded', {
            name: productName,
            sum: fmt(lineSubtotal(line)),
          }),
        }
      );
    },
    [t]
  );

  const openWeightModalForLine = useCallback((item) => {
    setWeightEditLineId(item.lineId);
    setWeightModalProduct({
      id: item.productId,
      name: item.name,
      sku: item.sku,
      saleType: 'WEIGHT',
      sellingPrice: item.unitPrice,
      stockQuantity: item.maxStock,
    });
  }, []);

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
      const saleType = product.saleType || 'PIECE';
      if (saleType !== 'SERVICE' && Number(product.stockQuantity) <= 0) {
        toast.error(t('pos.outOfStock'));
        return;
      }
      const payload = cartProductPayload(product);
      if (isWeightProduct(product)) {
        setWeightEditLineId(null);
        setWeightModalProduct(payload);
        return;
      }
      const lineId = addPieceItem(payload, 1);
      const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
      if (line) showLineAddedToast(line, product.name);
      setSelectedLineId(lineId);
    },
    [addPieceItem, cartProductPayload, shiftIsOpen, showLineAddedToast, t, setSelectedLineId]
  );

  const handleWeightConfirm = useCallback(
    (kg) => {
      const payload = weightModalProduct;
      if (!payload) return;
      let lineId = weightEditLineId;
      if (weightEditLineId) {
        updateQuantity(weightEditLineId, kg);
      } else {
        lineId = addWeightLine(payload, kg);
        const line = useCartStore.getState().items.find((i) => i.lineId === lineId);
        if (line) showLineAddedToast(line, payload.name);
      }
      setWeightModalProduct(null);
      setWeightEditLineId(null);
      if (lineId) setSelectedLineId(lineId);
    },
    [addWeightLine, showLineAddedToast, updateQuantity, weightEditLineId, weightModalProduct, setSelectedLineId]
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
    [storeId, addProductToCart, payOpen, returnOpen, t, setSearch, searchInputRef]
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
  }, [search, products, tryAddByBarcode, addProductToCart, t, setSearch]);

  const handleQtyDelta = useCallback(
    (lineId, delta) => {
      const items = useCartStore.getState().items;
      const item = items.find((i) => i.lineId === lineId);
      if (!item) return;
      if (item.saleType === 'WEIGHT') {
        const next = roundQty(item.quantity + delta * WEIGHT_QTY_STEP);
        if (next < MIN_WEIGHT_KG) {
          removeItem(lineId);
          if (selectedLineId === lineId) setSelectedLineId(null);
          return;
        }
        updateQuantity(lineId, next);
        return;
      }
      updateQuantity(lineId, item.quantity + delta);
    },
    [removeItem, selectedLineId, setSelectedLineId, updateQuantity]
  );

  const closeWeightModal = useCallback(() => {
    setWeightModalProduct(null);
    setWeightEditLineId(null);
  }, []);

  return {
    weightModalProduct,
    weightEditLineId,
    handleWeightConfirm,
    closeWeightModal,
    addProductToCart,
    handleSearchEnter,
    handleQtyDelta,
    openWeightModalForLine,
  };
}
