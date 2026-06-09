// src/components/reports/SaleFiscalPrintModal.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Printer, X, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { saleApi } from '../../../api';
import {
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { FiscalReceiptBody, ThermalPrintSettingsPanel } from '../../../components/receipt';

export default function SaleFiscalPrintModal({ saleId, onClose }) {
  const { t } = useTranslation();
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { data: sale, isPending, isError, error } = useQuery({
    queryKey: ['sale-fiscal', saleId],
    queryFn: () => saleApi.getById(saleId).then((r) => r.data),
    enabled: Boolean(saleId),
  });

  const handlePrint = async () => {
    if (!sale || printing) return;
    setPrinting(true);
    try {
      await printFiscalReceipt({ sale, t, useModalShell: true });
      toast.success(t('receipt.printSent'), { id: 'sale-fiscal-print' });
    } catch (e) {
      toast.error(resolveEscposPrintErrorMessage(e, t) ?? t('receipt.printFailed'), {
        id: 'sale-fiscal-print',
      });
    } finally {
      setPrinting(false);
    }
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
              disabled={!sale || printing}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-500 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
            >
              <Printer size={14} />
              {printing ? t('common.loading') : t('receipt.print')}
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
          className="overflow-y-auto overflow-x-hidden px-5 py-4 print:overflow-visible print:px-0 print:py-0"
        >
          {isPending && <p className="text-center text-sm text-slate-500">{t('common.loading')}</p>}
          {isError && (
            <p className="text-center text-sm text-red-600">
              {error?.response?.data?.message ?? error?.message ?? t('salesLedger.loadError')}
            </p>
          )}
          {sale ? (
            <div className="bg-white text-black dark:bg-white dark:text-black">
              <FiscalReceiptBody sale={sale} />
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 print:hidden dark:border-slate-800">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!sale || printing}
            className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {printing ? t('common.loading') : t('receipt.print')}
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
