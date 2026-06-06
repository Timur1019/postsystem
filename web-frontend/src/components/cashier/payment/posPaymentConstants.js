import {
  CreditCard,
  Coins,
  Wallet,
  Banknote,
  Split,
  Building2,
  Heart,
} from 'lucide-react';
import { round2 } from '../../../utils/taxAmounts';

export const RECEIPT_TYPES = [
  { id: 'SALE', icon: CreditCard },
  { id: 'ADVANCE', icon: Coins },
  { id: 'CREDIT', icon: Wallet },
];

export const CARD_TYPES = [
  { id: 'PERSONAL', labelKey: 'pos.cardPersonal', icon: CreditCard },
  { id: 'CORPORATE', labelKey: 'pos.cardCorporate', icon: Building2 },
  { id: 'SOCIAL', labelKey: 'pos.cardSocial', icon: Heart },
];

export const PAY_METHODS = [
  { id: 'cash', icon: Banknote, labelKey: 'pos.payCash', action: 'cash' },
  { id: 'card', icon: CreditCard, labelKey: 'pos.payCard', action: 'card' },
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
