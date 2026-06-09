import { Banknote, CreditCard, Coins, Smartphone, Wallet } from 'lucide-react';

export default function PaymentIcon({ method }) {
  const Icon =
    method === 'ADVANCE'
      ? Coins
      : method === 'CREDIT'
        ? Wallet
        : method === 'CARD'
          ? CreditCard
          : method === 'CASHLESS'
            ? Smartphone
            : method === 'MPESA'
              ? Smartphone
              : method === 'MIXED'
                ? Wallet
                : Banknote;
  return <Icon size={14} className="text-slate-600 dark:text-slate-400" />;
}
