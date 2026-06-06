import {
  CreditCard,
  Coins,
  Wallet,
  Banknote,
  Split,
  QrCode,
} from 'lucide-react';
import { round2 } from '../../../utils/taxAmounts';

export const RECEIPT_TYPES = [
  { id: 'SALE', icon: CreditCard },
  { id: 'ADVANCE', icon: Coins },
  { id: 'CREDIT', icon: Wallet },
];

export const CARD_TYPES = [
  { id: 'HUMO', labelKey: 'pos.cardHumo', icon: CreditCard },
  { id: 'UZCARD', labelKey: 'pos.cardUzcard', icon: CreditCard },
];

export const PAY_METHODS = [
  { id: 'cash', icon: Banknote, labelKey: 'pos.payCash', action: 'cash' },
  { id: 'card', icon: CreditCard, labelKey: 'pos.payCard', action: 'card' },
  { id: 'cashless', icon: QrCode, labelKey: 'pos.payCashless', action: 'cashless' },
  { id: 'mixed', icon: Split, labelKey: 'pos.payMixed', action: 'mixed' },
];

export const STEPS_WITH_PRINT_TOGGLE = new Set(['cash', 'mixedCash', 'mixedCard', 'cardType', 'receipt']);

export const isDeferredReceiptType = (type) => type === 'ADVANCE' || type === 'CREDIT';

export const amountStr = (n) => {
  const v = round2(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

export const parseTenderedInput = (raw) =>
  round2(Number(String(raw ?? '').replace(/\s/g, '').replace(',', '.')) || 0);
