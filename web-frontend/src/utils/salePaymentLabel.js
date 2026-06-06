export function cardTypeLabel(cardType, t) {
  if (!cardType) return null;
  switch (cardType) {
    case 'HUMO':
      return t('pos.cardHumo');
    case 'UZCARD':
      return t('pos.cardUzcard');
    case 'PERSONAL':
      return t('pos.cardPersonal', { defaultValue: 'Личная' });
    case 'CORPORATE':
      return t('pos.cardCorporate', { defaultValue: 'Корп.' });
    case 'SOCIAL':
      return t('pos.cardSocial', { defaultValue: 'Социальная' });
    default:
      return cardType;
  }
}

export function salePaymentLabel(row, t) {
  if (row.receiptType === 'CREDIT' || row.receiptType === 'ADVANCE') {
    return t(`pos.receiptType.${row.receiptType}`);
  }
  const m = row.paymentMethod;
  if (m === 'CARD') {
    const card = cardTypeLabel(row.cardType, t);
    return card ? `${t('sales.paymentCard')} · ${card}` : t('sales.paymentCard');
  }
  if (m === 'MIXED') {
    const card = cardTypeLabel(row.cardType, t);
    return card ? `${t('salesLedger.filters.mixed')} · ${card}` : t('salesLedger.filters.mixed');
  }
  if (m === 'CASHLESS') return t('sales.paymentCashless');
  if (m === 'MPESA') return t('sales.paymentMpesa');
  if (m === 'CASH') return t('sales.paymentCash');
  return m || '—';
}
