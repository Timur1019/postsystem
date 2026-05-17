// src/components/reports/SaleFiscalPrintModal.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Printer, X, Settings2 } from 'lucide-react';
import { saleApi } from '../../services/api';
import { printWithHtmlClass } from '../../utils/printWithHtmlClass';
import ThermalPrintSettingsPanel from '../receipt/ThermalPrintSettingsPanel';
import { APP_NAME } from '../../config/brand';

const fmtMoney = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

const fmtQty = (q) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(q) || 0);

const PAYMENT_I18N = {
  CASH: 'sales.paymentCash',
  CARD: 'sales.paymentCard',
  MPESA: 'sales.paymentMpesa',
  MIXED: 'salesLedger.filters.mixed',
};

export default function SaleFiscalPrintModal({ saleId, onClose }) {
  const { t } = useTranslation();
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);
  const { data: sale, isPending, isError, error } = useQuery({
    queryKey: ['sale-fiscal', saleId],
    queryFn: () => saleApi.getById(saleId).then((r) => r.data),
    enabled: Boolean(saleId),
  });

  const companyName =
    import.meta.env.VITE_COMPANY_NAME ||
    import.meta.env.VITE_STORE_BRAND ||
    APP_NAME;
  const companyAddress = import.meta.env.VITE_COMPANY_ADDRESS || t('fiscalReceipt.defaultAddress');
  const fiscalCardId = import.meta.env.VITE_FISCAL_CARD_ID || t('fiscalReceipt.fiscalCardPlaceholder');

  const payLabel = (m) => t(PAYMENT_I18N[m] ?? 'sales.paymentCash');

  const fmtAt = (iso) => {
    try {
      const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
      return { date: format(d, 'yyyy-MM-dd'), time: format(d, 'HH:mm:ss') };
    } catch {
      return { date: '—', time: '—' };
    }
  };

  const handlePrint = () => {
    printWithHtmlClass('print-fiscal-only');
  };

  if (!saleId) return null;

  return (
    <div
      className="fiscal-print-scene fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
        <button
          type="button"
          className="absolute inset-0 bg-black/60 print:hidden"
          aria-label={t('common.cancel')}
          onClick={onClose}
        />
        <div
          className="fiscal-print-dialog relative z-[1] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 print:hidden dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('fiscalReceipt.title')}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPrintSettingsOpen((o) => !o)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  printSettingsOpen
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
                aria-expanded={printSettingsOpen}
              >
                <Settings2 size={14} />
                {t('printSettings.toggleShort')}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-500 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
              >
                <Printer size={14} />
                {t('receipt.print')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={t('common.cancel')}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {printSettingsOpen ? (
            <div className="border-b border-slate-200 px-4 py-3 print:hidden dark:border-slate-800">
              <ThermalPrintSettingsPanel compact />
            </div>
          ) : null}

          <div
            id="fiscal-print-shell"
            className="overflow-y-auto px-5 py-4 print:overflow-visible print:px-0 print:py-0"
          >
            {isPending && <p className="text-center text-sm text-slate-500">{t('common.loading')}</p>}
            {isError && (
              <p className="text-center text-sm text-red-600">
                {error?.response?.data?.message ?? error?.message ?? t('salesLedger.loadError')}
              </p>
            )}
            {sale && (
              <div className="font-mono text-[11px] leading-relaxed text-slate-900 dark:text-slate-100 print:text-black">
                <div className="mb-3 border-b border-dashed border-slate-300 pb-3 text-center print:border-slate-400">
                  <p className="text-sm font-bold uppercase tracking-tight">{companyName}</p>
                  <p className="mt-2 whitespace-pre-line text-[10px] text-slate-600 dark:text-slate-400 print:text-slate-800">
                    {companyAddress}
                  </p>
                </div>

                <div className="mb-2 space-y-0.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">{t('fiscalReceipt.fiscalCardId')}</span>
                    <span className="text-right font-medium">{fiscalCardId}</span>
                  </div>
                  {(() => {
                    const { date, time } = fmtAt(sale.createdAt);
                    return (
                      <>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-400">{t('fiscalReceipt.date')}</span>
                          <span>{date}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-400">{t('fiscalReceipt.time')}</span>
                          <span>{time}</span>
                        </div>
                      </>
                    );
                  })()}
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">{t('fiscalReceipt.receiptNoShort')}</span>
                    <span className="font-semibold">{sale.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">{t('fiscalReceipt.saleId')}</span>
                    <span className="break-all text-right">{String(sale.id).replace(/-/g, '').slice(0, 20)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">{t('fiscalReceipt.employee')}</span>
                    <span className="max-w-[60%] truncate text-right">{sale.cashierName}</span>
                  </div>
                </div>

                <p className="mb-2 mt-3 font-semibold text-slate-800 dark:text-slate-200">{t('fiscalReceipt.saleSection')}</p>
                <div className="mb-3 border-t border-dashed border-slate-300 pt-2 print:border-slate-400" />

                <div className="mb-3 space-y-3">
                  {(sale.items ?? []).map((item, idx) => {
                    const rate = item.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
                    const taxAmt = item.taxAmount != null ? Number(item.taxAmount) : 0;
                    return (
                      <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                        <p className="text-[12px] font-medium text-slate-900 dark:text-white">{item.productName}</p>
                        <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                          {fmtQty(item.quantity)} × {fmtMoney(item.unitPrice)}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold">{fmtMoney(item.lineTotal)}</p>
                        <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                          {t('receipt.vatIncludedLine', { rate: rate.toFixed(2) })} — {fmtMoney(taxAmt)}
                        </p>
                        {item.ikpu ? (
                          <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                            {t('receipt.ikpuLine')}: {item.ikpu}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1 border-t border-dashed border-slate-300 pt-2 print:border-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{t('fiscalReceipt.discountsSum')}</span>
                    <span>{fmtMoney(sale.discountTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{t('fiscalReceipt.totalNoDiscount')}</span>
                    <span>{fmtMoney(sale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{t('fiscalReceipt.vatIncludedTotal')}</span>
                    <span>{fmtMoney(sale.taxTotal)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-bold print:border-slate-300">
                    <span>{t('fiscalReceipt.grandTotal')}</span>
                    <span>{fmtMoney(sale.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-slate-700 dark:text-slate-300">
                    <span>
                      {sale.paymentMethod === 'CASH'
                        ? t('fiscalReceipt.payCashShort')
                        : payLabel(sale.paymentMethod)}
                      :
                    </span>
                    <span>{fmtMoney(sale.amountTendered)}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-0.5 border-t border-dashed border-slate-300 pt-3 text-[10px] text-slate-600 dark:text-slate-500 print:border-slate-400 print:text-slate-800">
                  <div className="flex justify-between">
                    <span>{t('fiscalReceipt.registerNo')}</span>
                    <span>{import.meta.env.VITE_REGISTER_NO ?? '1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('fiscalReceipt.serialNo')}</span>
                    <span>{import.meta.env.VITE_REGISTER_SERIAL ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('fiscalReceipt.model')}</span>
                    <span>{import.meta.env.VITE_REGISTER_MODEL ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('fiscalReceipt.appletVer')}</span>
                    <span>{import.meta.env.VITE_APPLET_VERSION ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('fiscalReceipt.fiscalModuleId')}</span>
                    <span className="max-w-[55%] break-all text-right">{fiscalCardId}</span>
                  </div>
                </div>

                <p className="mt-4 text-center text-[10px] text-slate-500 print:text-slate-600">{t('fiscalReceipt.footer')}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 print:hidden dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t('receipt.print')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
          </div>
      </div>
    </div>
  );
}
