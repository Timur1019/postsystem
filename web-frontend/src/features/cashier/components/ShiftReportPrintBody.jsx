import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { fmtMoney } from '../../../utils/formatMoney';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';

const fmtAt = (iso) => {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'dd.MM.yyyy HH:mm');
  } catch {
    return '—';
  }
};

function Row({ label, value, bold = false }) {
  return (
    <div className={`receipt-row${bold ? ' receipt-row--bold' : ''}`}>
      <span className="receipt-meta-label">{label}</span>
      <span className="receipt-row__value">{value}</span>
    </div>
  );
}

export default function ShiftReportPrintBody({ report }) {
  const { t } = useTranslation();
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);

  if (!report) return null;

  const title = report.reportType === 'X' ? t('pos.xReport') : t('pos.zReport');
  const currency = t('fiscalReceipt.currency');

  return (
    <>
      <header className="receipt-section border-b border-dashed border-black pb-3 text-center">
        <p className="receipt-title">{displayAppName()}</p>
        <p className="receipt-subtitle mt-1 font-bold uppercase">{title}</p>
        <p className="receipt-subtitle mt-1">{report.storeName}</p>
        <p className="receipt-secondary">{report.cashierName}</p>
      </header>

      <section className="receipt-section mt-2 space-y-0.5">
        <Row label={t('zReports.openedAt')} value={fmtAt(report.openedAt)} />
        <Row label={t('pos.reportAt')} value={fmtAt(report.reportAt)} />
      </section>

      <div className="receipt-divider my-2 border-t border-dashed border-black" />

      <section className="receipt-section space-y-0.5">
        <Row label={t('pos.shiftSales')} value={String(report.saleCount)} />
        <Row label={t('pos.shiftTotal')} value={`${fmtMoney(report.totalAmount)} ${currency}`} bold />
        <Row label={t('pos.shiftCash')} value={`${fmtMoney(report.cashAmount)} ${currency}`} />
        <Row label={t('pos.shiftCard')} value={`${fmtMoney(report.cardAmount)} ${currency}`} />
        <Row label={t('pos.shiftHumo')} value={`${fmtMoney(report.humoAmount)} ${currency}`} />
        <Row label={t('pos.shiftUzcard')} value={`${fmtMoney(report.uzcardAmount)} ${currency}`} />
        <Row label={t('pos.shiftCashless')} value={`${fmtMoney(report.cashlessAmount)} ${currency}`} />
        <Row label={t('pos.shiftVat')} value={`${fmtMoney(report.vatAmount)} ${currency}`} />
        {Number(report.lineDiscountTotal ?? 0) > 0 ? (
          <Row
            label={t('fiscalReceipt.lineDiscountsSum')}
            value={`${fmtMoney(report.lineDiscountTotal)} ${currency}`}
          />
        ) : null}
        {Number(report.orderDiscountTotal ?? 0) > 0 ? (
          <Row
            label={t('fiscalReceipt.orderDiscountSum')}
            value={`${fmtMoney(report.orderDiscountTotal)} ${currency}`}
          />
        ) : null}
        {Number(report.discountTotal) > 0 ? (
          <Row
            label={t('fiscalReceipt.discountsSum')}
            value={`${fmtMoney(report.discountTotal)} ${currency}`}
            bold
          />
        ) : null}
      </section>

      <div className="receipt-divider my-2 border-t border-dotted border-black" />

      <section className="receipt-section space-y-0.5">
        <p className="receipt-section-title mb-1">{t('zReports.sectionReturn')}</p>
        <Row label={t('zReports.returnCash')} value={`${fmtMoney(report.returnsCash)} ${currency}`} />
        <Row label={t('zReports.returnCard')} value={`${fmtMoney(report.returnsCard)} ${currency}`} />
        <Row label={t('zReports.returnHumo')} value={`${fmtMoney(report.returnsHumo)} ${currency}`} />
        <Row label={t('zReports.returnUzcard')} value={`${fmtMoney(report.returnsUzcard)} ${currency}`} />
        <Row label={t('zReports.returnCashless')} value={`${fmtMoney(report.returnsCashless)} ${currency}`} />
        <Row label={t('zReports.returnVat')} value={`${fmtMoney(report.returnsVat)} ${currency}`} />
        <Row label={t('zReports.returnCount')} value={String(report.returnsCount ?? 0)} />
      </section>
    </>
  );
}
