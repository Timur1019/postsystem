import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { fmtMoney } from '../../utils/formatMoney';

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

export default function ZReportReceiptBody({ z }) {
  const { t } = useTranslation();

  if (!z) return null;

  const brand = z.brandName || 'Aurent';
  const company = z.companyName || z.storeName || '—';
  const currency = t('fiscalReceipt.currency');

  return (
    <>
      <header className="receipt-section border-b border-dashed border-black pb-3 text-center">
        <p className="receipt-title">{brand}</p>
        <p className="receipt-subtitle mt-1 font-bold uppercase">{t('pos.zReport')}</p>
        <p className="receipt-subtitle mt-1">{company}</p>
        {z.companyAddress ? (
          <p className="receipt-secondary mt-1 whitespace-pre-line">{z.companyAddress}</p>
        ) : null}
      </header>

      <section className="receipt-section mt-2 space-y-0.5">
        <Row label={t('zReports.printTerminalSerial')} value={z.terminalSerial ?? '—'} />
        <Row label={t('zReports.printAppletVer')} value={z.appletVersion ?? '—'} />
        <Row label={t('zReports.printEmployee')} value={z.employeeName ?? '—'} />
        <Row label={t('zReports.printStoreName')} value={z.storeName ?? '—'} />
        <Row label={t('cashRegisters.colFiscal')} value={z.fiscalCardId ?? '—'} />
        {z.tin ? <Row label="TIN" value={z.tin} /> : null}
        <Row label={t('zReports.printZNumber')} value={String(z.zNumber ?? '—')} bold />
      </section>

      <div className="receipt-divider my-2 border-t border-dashed border-black" />

      <section className="receipt-section space-y-0.5">
        <p className="receipt-section-title mb-1">{t('zReports.sectionSale')}</p>
        <Row label={t('zReports.saleCash')} value={`${fmtMoney(z.cashTotal)} ${currency}`} />
        <Row label={t('zReports.saleCard')} value={`${fmtMoney(z.cardTotal)} ${currency}`} />
        <Row label={t('zReports.saleVat')} value={`${fmtMoney(z.vatAmount)} ${currency}`} />
        <Row label={t('zReports.saleCount')} value={String(z.salesCount ?? 0)} />
        {Number(z.lineDiscountTotal ?? 0) > 0 ? (
          <Row
            label={t('fiscalReceipt.lineDiscountsSum')}
            value={`${fmtMoney(z.lineDiscountTotal)} ${currency}`}
          />
        ) : null}
        {Number(z.orderDiscountTotal ?? 0) > 0 ? (
          <Row
            label={t('fiscalReceipt.orderDiscountSum')}
            value={`${fmtMoney(z.orderDiscountTotal)} ${currency}`}
          />
        ) : null}
        {Number(z.discountTotal ?? 0) > 0 ? (
          <Row
            label={t('fiscalReceipt.discountsSum')}
            value={`${fmtMoney(z.discountTotal)} ${currency}`}
            bold
          />
        ) : null}
      </section>

      <div className="receipt-divider my-2 border-t border-dotted border-black" />

      <section className="receipt-section space-y-0.5">
        <p className="receipt-section-title mb-1">{t('zReports.sectionReturn')}</p>
        <Row label={t('zReports.returnCash')} value={`${fmtMoney(z.returnsCash)} ${currency}`} />
        <Row label={t('zReports.returnCard')} value={`${fmtMoney(z.returnsCard)} ${currency}`} />
        <Row label={t('zReports.returnVat')} value={`${fmtMoney(z.vatReturn)} ${currency}`} />
        <Row label={t('zReports.returnCount')} value={String(z.returnsCount ?? 0)} />
      </section>

      <div className="receipt-divider my-2 border-t border-dotted border-black" />

      <section className="receipt-section space-y-0.5">
        <Row label={t('zReports.openedAt')} value={fmtAt(z.openedAt)} />
        <Row label={t('zReports.closedAt')} value={fmtAt(z.closedAt)} />
        <Row label={t('zReports.firstReceipt')} value={z.firstReceiptNumber ?? '—'} />
        <Row label={t('zReports.lastReceipt')} value={z.lastReceiptNumber ?? '—'} />
      </section>

      <div className="receipt-divider my-2 border-t border-dashed border-black" />

      <section className="receipt-section">
        <Row label={t('zReports.grandTotal')} value={`${fmtMoney(z.totalAmount)} ${currency}`} bold />
      </section>
    </>
  );
}
