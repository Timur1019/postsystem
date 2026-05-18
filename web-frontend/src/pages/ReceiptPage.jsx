// src/pages/ReceiptPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { saleApi } from '../services/api';
import { format } from 'date-fns';
import { Printer, ArrowLeft, ShoppingCart, Settings2 } from 'lucide-react';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';
import { printWithHtmlClass, POS_RECEIPT_PRINT_EVENT } from '../utils/printWithHtmlClass';
import ThermalPrintSettingsPanel from '../components/receipt/ThermalPrintSettingsPanel';
import { APP_NAME } from '../config/brand';

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

const PAYMENT_I18N = {
  CASH: 'sales.paymentCash',
  CARD: 'sales.paymentCard',
  MPESA: 'sales.paymentMpesa',
  MIXED: 'salesLedger.filters.mixed',
};

export default function ReceiptPage() {
  const { t } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { receiptNumber } = useParams();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: sale, isLoading } = useQuery({
    queryKey: ['receipt', receiptNumber],
    queryFn: () => saleApi.getReceipt(receiptNumber).then(r => r.data),
  });

  useEffect(() => {
    const runPrint = () => printWithHtmlClass('print-receipt-only');
    window.addEventListener(POS_RECEIPT_PRINT_EVENT, runPrint);
    return () => window.removeEventListener(POS_RECEIPT_PRINT_EVENT, runPrint);
  }, []);

  const paymentMethodLabel = (method) =>
    t(PAYMENT_I18N[method] ?? 'sales.paymentCash');

  const brand =
    import.meta.env.VITE_STORE_BRAND || import.meta.env.VITE_COMPANY_NAME || APP_NAME;
  const location = import.meta.env.VITE_STORE_LOCATION || t('receipt.storeLocation');
  const phone = import.meta.env.VITE_STORE_PHONE || t('receipt.storePhone');

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-slate-400">{t('receipt.loading')}</div>
  );
  if (!sale) return (
    <div className="text-center text-slate-400 py-10">{t('receipt.notFound')}</div>
  );

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/95 px-1 py-3 backdrop-blur print:hidden dark:border-slate-800 dark:bg-slate-950/95 sm:-mx-4 sm:px-0">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          {t('receipt.backPos')}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              settingsOpen
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Settings2 size={16} />
            {t('printSettings.toggle')}
          </button>
          <button
            type="button"
            onClick={() => printWithHtmlClass('print-receipt-only')}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Printer size={16} />
            {t('receipt.print')}
          </button>
        </div>
      </div>

      {settingsOpen ? (
        <div className="print:hidden">
          <ThermalPrintSettingsPanel />
        </div>
      ) : null}

      <div className="mx-auto max-w-md">
      {/* Receipt */}
      <div
        id="receipt-print-area"
        className="bg-white text-gray-900 rounded-xl p-6 font-mono text-sm shadow-2xl"
      >
        {/* Store header */}
        <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShoppingCart size={20} className="text-emerald-600" />
            <span className="font-bold text-lg">{brand}</span>
          </div>
          <p className="text-gray-500 text-xs">{location}</p>
          <p className="text-gray-500 text-xs">{phone}</p>
        </div>

        {/* Receipt meta */}
        <div className="space-y-1 mb-4 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('receipt.receiptNo')}</span>
            <span className="font-bold">{sale.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('receipt.date')}</span>
            <span>{format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('receipt.cashier')}</span>
            <span>{sale.cashierName}</span>
          </div>
          {sale.customerName && (
            <div className="flex justify-between">
              <span className="text-gray-500">{t('receipt.customer')}</span>
              <span>{sale.customerName}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-300 mb-3" />

        {/* Items */}
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-12 text-xs text-gray-400 font-semibold mb-1">
            <span className="col-span-6">{t('receipt.item')}</span>
            <span className="col-span-2 text-center">{t('receipt.qty')}</span>
            <span className="col-span-2 text-right">{t('receipt.price')}</span>
            <span className="col-span-2 text-right">{t('receipt.lineTotal')}</span>
          </div>
          {sale.items?.map((item, i) => {
            const rate = item.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
            const taxAmt = item.taxAmount != null ? Number(item.taxAmount) : 0;
            return (
            <div key={i} className="space-y-0.5 border-b border-dashed border-gray-100 pb-2 mb-2 last:border-0">
              <div className="grid grid-cols-12 text-xs">
                <span className="col-span-6 truncate">{item.productName}</span>
                <span className="col-span-2 text-center">{item.quantity}</span>
                <span className="col-span-2 text-right">{fmt(item.unitPrice)}</span>
                <span className="col-span-2 text-right font-semibold">{fmt(item.lineTotal)}</span>
              </div>
              {taxAmt > 0 && (
                <p className="pl-0 text-[11px] text-gray-600">
                  {t('receipt.vatIncludedLine', { rate: rate.toFixed(2) })}: {fmt(taxAmt)}
                </p>
              )}
              {item.ikpu ? (
                <p className="text-[11px] text-gray-500">{t('receipt.ikpuLine')}: {item.ikpu}</p>
              ) : null}
            </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-300 mb-3" />

        {/* Totals */}
        <div className="space-y-1 text-xs mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('receipt.subtotal')}</span>
            <span>{fmt(sale.subtotal)}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>{t('receipt.discount')}</span>
              <span>-{fmt(sale.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">{t('receipt.vat')}</span>
            <span>{fmt(sale.taxTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-1 mt-1">
            <span>{t('receipt.total')}</span>
            <span>{fmt(sale.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>{t('receipt.payment', { method: paymentMethodLabel(sale.paymentMethod) })}</span>
            <span>
              {sale.paymentMethod === 'MIXED'
                ? `${fmt(sale.cashAmount)} + ${fmt(sale.cardAmount)}`
                : fmt(sale.amountTendered)}
            </span>
          </div>
          {sale.paymentMethod === 'MIXED' && (
            <>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>{t('pos.mixedCashPart')}</span>
                <span>{fmt(sale.cashAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>{t('pos.mixedCardPart')}</span>
                <span>{fmt(sale.cardAmount)}</span>
              </div>
            </>
          )}
          {sale.changeGiven > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>{t('receipt.change')}</span>
              <span>{fmt(sale.changeGiven)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center border-t border-dashed border-gray-300 pt-4 text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-700">{t('receipt.thanks')}</p>
          <p>{t('receipt.policy1')}</p>
          <p>{t('receipt.policy2')}</p>
        </div>
      </div>
      </div>
    </div>
  );
}
