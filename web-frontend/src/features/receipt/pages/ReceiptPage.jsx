import { FiscalReceiptBody, ThermalPrintSettingsPanel } from '../../../components/receipt';
import ReceiptPageHeader from '../components/ReceiptPageHeader';
import { useReceiptPage } from '../hooks/useReceiptPage';

export default function ReceiptPage() {
  const p = useReceiptPage();

  if (p.isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400">{p.t('receipt.loading')}</div>
    );
  }
  if (!p.sale) {
    return <div className="py-10 text-center text-slate-400">{p.t('receipt.notFound')}</div>;
  }

  if (p.silentJob) {
    return (
      <div className="receipt-page receipt-page--silent min-h-0 bg-white p-0">
        <FiscalReceiptBody sale={p.sale} />
      </div>
    );
  }

  return (
    <div className="receipt-page min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 to-slate-100 px-3 py-4 dark:from-slate-950 dark:to-slate-900">
      <ReceiptPageHeader {...p} />
      {p.settingsOpen ? (
        <div className={`mx-auto mb-3 ${p.headerWidthCls} print:hidden`}>
          <ThermalPrintSettingsPanel />
        </div>
      ) : null}
      <div className="receipt-page__paper mx-auto w-full">
        <div className="receipt-page__card overflow-hidden rounded-md bg-white p-0 text-black shadow-lg ring-1 ring-slate-200 print:rounded-none print:shadow-none print:ring-0 dark:bg-white dark:text-black dark:ring-slate-700">
          <FiscalReceiptBody sale={p.sale} />
        </div>
      </div>
    </div>
  );
}
