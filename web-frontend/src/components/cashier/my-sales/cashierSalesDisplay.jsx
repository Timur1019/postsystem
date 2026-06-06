export function isDeferredReceiptType(receiptType) {
  return receiptType === 'ADVANCE' || receiptType === 'CREDIT';
}

export function cashierSalesPaymentLabel(method, t, receiptType) {
  if (isDeferredReceiptType(receiptType)) {
    return t(`pos.receiptType.${receiptType}`);
  }
  switch (method) {
    case 'CASH':
      return t('pos.payCash');
    case 'CARD':
      return t('pos.payCard');
    case 'CASHLESS':
      return t('pos.payCashless');
    case 'MIXED':
      return t('pos.payMixed');
    case 'MPESA':
      return 'M-Pesa';
    default:
      return method || '—';
  }
}

export function cashierSalesPaymentPillClass(method, receiptType) {
  if (receiptType === 'ADVANCE') return 'cashier-sales-pill--advance';
  if (receiptType === 'CREDIT') return 'cashier-sales-pill--credit';
  switch (method) {
    case 'CASH':
      return 'cashier-sales-pill--cash';
    case 'CARD':
      return 'cashier-sales-pill--card';
    case 'CASHLESS':
      return 'cashier-sales-pill--cashless';
    case 'MIXED':
      return 'cashier-sales-pill--mixed';
    case 'MPESA':
      return 'cashier-sales-pill--mpesa';
    default:
      return '';
  }
}

export function CashierSalesStatusBadge({ status, t }) {
  if (status === 'VOIDED') {
    return <span className="cashier-sales-badge cashier-sales-badge--voided">{t('pos.statusVoided')}</span>;
  }
  if (status === 'REFUNDED') {
    return <span className="cashier-sales-badge cashier-sales-badge--refunded">{t('pos.statusRefunded')}</span>;
  }
  if (status === 'COMPLETED') {
    return <span className="cashier-sales-badge cashier-sales-badge--completed">{t('pos.statusCompleted')}</span>;
  }
  return null;
}
