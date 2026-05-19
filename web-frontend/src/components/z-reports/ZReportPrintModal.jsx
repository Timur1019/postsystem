// src/components/z-reports/ZReportPrintModal.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Printer, X, Settings2 } from 'lucide-react';
import { zReportApi } from '../../services/api';
import { printWithHtmlClass } from '../../utils/printWithHtmlClass';
import ThermalPrintSettingsPanel from '../receipt/ThermalPrintSettingsPanel';

import { fmtMoney } from '../../utils/formatMoney';

const fmtAt = (iso) => {
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return '—';
  }
};

export default function ZReportPrintModal({ zReportId, onClose }) {
  const { t } = useTranslation();
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);
  const { data: z, isPending, isError, error } = useQuery({
    queryKey: ['z-report-print', zReportId],
    queryFn: () => zReportApi.getById(zReportId).then((r) => r.data),
    enabled: Boolean(zReportId),
  });

  const handlePrint = () => {
    printWithHtmlClass('print-z-report-only');
  };

  if (!zReportId) return null;

  const brand = z?.brandName || 'Tinda';
  const company = z?.companyName || z?.storeName || '—';

  return (
    <div
      className="z-report-print-scene fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 print:hidden"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        className="z-report-print-dialog relative z-[1] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
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
          id="z-report-print-shell"
          className="overflow-y-auto px-5 py-4 print:overflow-visible print:px-0 print:py-0"
        >
          {isPending && <p className="text-center text-sm text-slate-500">{t('common.loading')}</p>}
          {isError && (
            <p className="text-center text-sm text-red-600">
              {error?.response?.data?.message ?? error?.message ?? t('zReports.loadError')}
            </p>
          )}
          {z && (
            <div className="font-mono text-[11px] leading-relaxed text-slate-900 dark:text-slate-100 print:text-black">
              <div className="mb-3 border-b border-dashed border-slate-300 pb-3 text-center print:border-slate-400">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{brand}</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-tight">{company}</p>
                {z.companyAddress ? (
                  <p className="mt-2 whitespace-pre-line text-[10px] text-slate-600 dark:text-slate-400 print:text-slate-800">
                    {z.companyAddress}
                  </p>
                ) : null}
              </div>

              <div className="mb-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.printTerminalSerial')}</span>
                  <span className="font-medium">{z.terminalSerial ?? '—'}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.printAppletVer')}</span>
                  <span>{z.appletVersion ?? '—'}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.printEmployee')}</span>
                  <span className="max-w-[60%] text-right">{z.employeeName}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.printStoreName')}</span>
                  <span className="max-w-[60%] text-right">{z.storeName}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('cashRegisters.colFiscal')}</span>
                  <span className="break-all text-right">{z.fiscalCardId}</span>
                </div>
                {z.tin ? (
                  <div className="flex justify-between gap-2 py-0.5">
                    <span className="text-slate-600 dark:text-slate-400">TIN</span>
                    <span>{z.tin}</span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.printZNumber')}</span>
                  <span className="font-semibold">{z.zNumber}</span>
                </div>
              </div>

              <p className="mb-2 font-semibold text-slate-800 dark:text-slate-200">{t('cashRegisters.navZReports')}</p>

              <div className="mb-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">{t('zReports.sectionSale')}</p>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.saleCash')}</span>
                  <span>{fmtMoney(z.cashTotal)}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.saleCard')}</span>
                  <span>{fmtMoney(z.cardTotal)}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.saleVat')}</span>
                  <span>{fmtMoney(z.vatAmount)}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.saleCount')}</span>
                  <span>{z.salesCount ?? 0}</span>
                </div>
              </div>

              <div className="mb-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">{t('zReports.sectionReturn')}</p>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.returnCash')}</span>
                  <span>{fmtMoney(z.returnsCash)}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.returnCard')}</span>
                  <span>{fmtMoney(z.returnsCard)}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.returnVat')}</span>
                  <span>{fmtMoney(z.vatReturn)}</span>
                </div>
                <div className="flex justify-between gap-2 py-0.5">
                  <span className="text-slate-600 dark:text-slate-400">{t('zReports.returnCount')}</span>
                  <span>{z.returnsCount ?? 0}</span>
                </div>
                <div className="mt-2 border-t border-dashed border-slate-200 pt-2 dark:border-slate-600">
                  <div className="flex justify-between gap-2 py-0.5">
                    <span className="text-slate-600 dark:text-slate-400">{t('zReports.openedAt')}</span>
                    <span>{fmtAt(z.openedAt)}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-0.5">
                    <span className="text-slate-600 dark:text-slate-400">{t('zReports.closedAt')}</span>
                    <span>{fmtAt(z.closedAt)}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-0.5">
                    <span className="text-slate-600 dark:text-slate-400">{t('zReports.firstReceipt')}</span>
                    <span>{z.firstReceiptNumber ?? '—'}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-0.5">
                    <span className="text-slate-600 dark:text-slate-400">{t('zReports.lastReceipt')}</span>
                    <span>{z.lastReceiptNumber ?? '—'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t border-dashed border-slate-300 pt-2 text-sm font-bold print:border-slate-400">
                <span>{t('zReports.grandTotal')}</span>
                <span>{fmtMoney(z.totalAmount)}</span>
              </div>
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
