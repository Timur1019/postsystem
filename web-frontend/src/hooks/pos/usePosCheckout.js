import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CASHIER_ESCPOS_TOAST } from '../../config/cashierEscposConfig';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../services/cashierEscpos';
import { isDesktopCashier } from '../../utils/printReceipt';
import { clampPayAmount, round2 } from '../../utils/taxAmounts';
import { saleApi } from '../../services/api';
import { useCartStore } from '../../store/cartStore';
import { useConnectivityStore, userAllowedOfflinePos } from '../../store/connectivityStore';
import {
  offlineDecreaseStock,
  offlineGetCurrentShift,
  offlineSaveSale,
} from '../../services/offline/desktopOfflineBridge';
import {
  buildOfflineCheckoutPayload,
  buildOfflineSaleResponse,
} from '../../services/offline/buildOfflineSaleResponse';
import { refreshConnectivityStatus } from '../../store/connectivityStore';
import { useAuthStore } from '../../store/authStore';

async function processOfflineCheckout({
  storeId,
  payment,
  user,
  getCheckoutLineItems,
  getCheckoutOrderDiscountAmount,
  getCheckoutOrderDiscountPercent,
  items,
}) {
  const shift = await offlineGetCurrentShift({
    storeId,
    cashierId: user?.id,
  });
  if (!shift || shift.status !== 'OPEN') {
    throw new Error('OFFLINE_SHIFT_REQUIRED');
  }

  const clientSaleId = crypto.randomUUID();
  const receiptNumber = `OFF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;
  const cartItems = items;
  const orderDiscountAmount = getCheckoutOrderDiscountAmount();
  const orderDiscountPercent = getCheckoutOrderDiscountPercent();

  const payload = buildOfflineCheckoutPayload({
    storeId,
    payment,
    cartItems,
    orderDiscountAmount,
    orderDiscountPercent,
  });

  const response = buildOfflineSaleResponse({
    clientSaleId,
    receiptNumber,
    payment,
    storeId,
    storeName: shift.storeName,
    cashierName: user?.fullName || user?.username || shift.cashierName,
    shift,
    cartItems,
    orderDiscountAmount,
    orderDiscountPercent,
  });

  await offlineSaveSale({
    clientShiftId: shift.id || shift.clientShiftId,
    payload,
    response,
  });

  for (const line of cartItems) {
    await offlineDecreaseStock(line.productId, line.quantity);
  }

  await refreshConnectivityStatus();
  return { data: response };
}

export function usePosCheckout({
  storeId,
  total,
  setPayOpen,
  setSelectedLineId,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const offlinePos =
    userAllowedOfflinePos() &&
    useConnectivityStore((s) => s.offlineMode && s.canSellOffline);

  const clearCart = useCartStore((s) => s.clearCart);
  const getCheckoutLineItems = useCartStore((s) => s.getCheckoutLineItems);
  const getCheckoutOrderDiscountAmount = useCartStore((s) => s.getCheckoutOrderDiscountAmount);
  const getCheckoutOrderDiscountPercent = useCartStore((s) => s.getCheckoutOrderDiscountPercent);

  const checkoutMutation = useMutation({
    mutationFn: async (payment) => {
      const items = useCartStore.getState().items;
      if (offlinePos) {
        return processOfflineCheckout({
          storeId,
          payment,
          user,
          getCheckoutLineItems,
          getCheckoutOrderDiscountAmount,
          getCheckoutOrderDiscountPercent,
          items,
        });
      }
      return saleApi.create({
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
      });
    },
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
      const offlineSaved = Boolean(res.data?.offlinePendingSync);
      toast.success(offlineSaved ? t('offline.saleSavedLocally') : t('pos.saleSuccess'));

      if (shouldPrint && isCashierEscposPrintAvailable()) {
        try {
          await printFiscalReceipt({ sale: res.data, t });
          toast.success(t('receipt.printSent'), {
            id: CASHIER_ESCPOS_TOAST.toastId,
            duration: CASHIER_ESCPOS_TOAST.successDurationMs,
          });
        } catch (err) {
          toast.error(resolveEscposPrintErrorMessage(err, t), {
            id: CASHIER_ESCPOS_TOAST.toastId,
            duration: CASHIER_ESCPOS_TOAST.errorDurationMs,
          });
        }
        return;
      }

      if (shouldPrint) {
        navigate(`/receipt/${receiptNum}`, {
          state: { autoPrint: true, fromCashier: true },
        });
        return;
      }
      if (!isDesktopCashier()) {
        navigate(`/receipt/${receiptNum}`, { state: { fromCashier: true } });
      }
    },
    onError: (e) => {
      if (e?.message === 'OFFLINE_SHIFT_REQUIRED') {
        toast.error(t('pos.shiftRequired'));
        return;
      }
      const msg = e.response?.data?.message ?? e.message ?? t('pos.saleFailed');
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

  return { checkoutMutation, handleConfirmPayment };
}
