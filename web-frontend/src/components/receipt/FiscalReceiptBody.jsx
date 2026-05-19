import { useTranslation } from 'react-i18next';
import { APP_NAME } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import ReceiptQrCode from './ReceiptQrCode';
import {
  buildFiscalSign,
  buildQrPayload,
  fmtMoney,
  fmtQty,
  splitDateTime,
} from '../../utils/fiscalReceiptFormat';

const PAYMENT_I18N = {
  CASH: 'sales.paymentCash',
  CARD: 'sales.paymentCard',
  MPESA: 'sales.paymentMpesa',
  MIXED: 'salesLedger.filters.mixed',
};

function Row({ label, value, bold = false }) {
  return (
    <div className={`receipt-row flex justify-between gap-x-2 gap-y-0.5${bold ? ' receipt-row--bold' : ''}`}>
      <span className="receipt-meta-label min-w-0 flex-[1_1_45%]">{label}</span>
      <span className="min-w-0 flex-[1_1_50%] text-right break-all">{value}</span>
    </div>
  );
}

function ReceiptDivider() {
  return <div className="receipt-divider my-2 border-t border-dashed border-black" />;
}

export default function FiscalReceiptBody({ sale, printAreaId = 'receipt-print-area', className = '' }) {
  const { t } = useTranslation();
  const isOn = useTenantDisplayStore((s) => s.isReceiptFieldOn);
  const receiptLogoDataUrl = useTenantDisplayStore((s) => s.receiptLogoDataUrl);
  const customCompanyName = useTenantDisplayStore((s) => s.receiptCompanyName);
  const customCompanyAddress = useTenantDisplayStore((s) => s.receiptCompanyAddress);
  const customStir = useTenantDisplayStore((s) => s.receiptStir);

  if (!sale) return null;

  const companyName =
    customCompanyName ||
    import.meta.env.VITE_COMPANY_NAME ||
    import.meta.env.VITE_STORE_BRAND ||
    APP_NAME;
  const companyAddress =
    customCompanyAddress ||
    import.meta.env.VITE_COMPANY_ADDRESS ||
    t('fiscalReceipt.defaultAddress');
  const stir =
    customStir || import.meta.env.VITE_COMPANY_STIR || import.meta.env.VITE_STIR || '';
  const fiscalCardId =
    import.meta.env.VITE_FISCAL_CARD_ID || t('fiscalReceipt.fiscalCardPlaceholder');
  const virtualRegister =
    import.meta.env.VITE_VIRTUAL_REGISTER_ID || import.meta.env.VITE_REGISTER_NO || '1';
  const fmNumber = import.meta.env.VITE_FISCAL_MODULE_NUMBER || fiscalCardId;
  const shiftNo =
    import.meta.env.VITE_SHIFT_NO ||
    String(sale.receiptNumber || '').replace(/\D/g, '').slice(-3).padStart(3, '0') ||
    '001';

  const payLabel = (m) => t(PAYMENT_I18N[m] ?? 'sales.paymentCash');
  const { date, time } = splitDateTime(sale.createdAt);
  const fiscalSign = buildFiscalSign(sale);
  const qrValue = buildQrPayload(sale);

  const method = sale.paymentMethod;
  const total = Number(sale.totalAmount) || 0;
  const cashAmt =
    method === 'CASH'
      ? Number(sale.amountTendered) || total
      : method === 'MIXED'
        ? Number(sale.cashAmount) || 0
        : 0;
  const cardAmt =
    method === 'CARD'
      ? Number(sale.amountTendered) || total
      : method === 'MIXED'
        ? Number(sale.cardAmount) || 0
        : 0;
  const paidTotal =
    method === 'MIXED'
      ? cashAmt + cardAmt
      : method === 'CASH'
        ? Number(sale.amountTendered) || total
        : total;
  const change = Number(sale.changeGiven) || 0;

  const vatRates = new Set(
    (sale.items ?? [])
      .map((i) => (i.taxRatePercent != null ? Number(i.taxRatePercent) : 12))
      .filter((r) => r > 0)
  );
  const vatRateLabel = vatRates.size === 1 ? `${[...vatRates][0].toFixed(0)}` : '—';

  const showHeader =
    isOn('logo') ||
    isOn('companyName') ||
    isOn('companyAddress') ||
    (isOn('stir') && stir);
  const showMeta =
    isOn('dateTime') || isOn('receiptNo') || isOn('employee') || isOn('shift');

  return (
    <div
      id={printAreaId}
      className={`receipt-print-root min-w-0 max-w-full overflow-hidden ${className}`}
    >
      {showHeader ? (
        <header className="receipt-section border-b border-dashed border-black pb-3 text-center">
          {isOn('logo') && receiptLogoDataUrl ? (
            <img
              src={receiptLogoDataUrl}
              alt=""
              className="mx-auto mb-2 max-h-16 max-w-full object-contain"
            />
          ) : null}
          {isOn('companyName') ? (
            <p className="receipt-title break-words">{companyName}</p>
          ) : null}
          {isOn('companyAddress') ? (
            <p className="receipt-subtitle mt-1 whitespace-pre-line break-words">{companyAddress}</p>
          ) : null}
          {isOn('stir') && stir ? (
            <p className="receipt-subtitle mt-1">
              {t('fiscalReceipt.stir')}: {stir}
            </p>
          ) : null}
        </header>
      ) : null}

      {showMeta ? (
        <section className="receipt-section mt-2 space-y-0.5">
          <div className="receipt-meta-grid grid grid-cols-2 gap-x-2 gap-y-1">
            {isOn('dateTime') ? (
              <>
                <div className="min-w-0">
                  <span className="receipt-meta-label">{t('fiscalReceipt.date')}: </span>
                  <span>{date}</span>
                </div>
                <div className="min-w-0 text-right">
                  <span className="receipt-meta-label">{t('fiscalReceipt.time')}: </span>
                  <span>{time}</span>
                </div>
              </>
            ) : null}
            {isOn('receiptNo') ? (
              <div className="min-w-0 col-span-2">
                <span className="receipt-meta-label">{t('fiscalReceipt.receiptNoShort')}: </span>
                <span className="break-all">№{sale.receiptNumber}</span>
              </div>
            ) : null}
            {isOn('employee') ? (
              <div className="min-w-0 col-span-2">
                <span className="receipt-meta-label">{t('fiscalReceipt.employee')}: </span>
                <span className="break-words">{sale.cashierName}</span>
              </div>
            ) : null}
            {isOn('shift') ? (
              <div className="min-w-0 col-span-2">
                <span className="receipt-meta-label">{t('fiscalReceipt.shift')}: </span>
                <span>{shiftNo}</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {isOn('items') ? (
        <>
          <ReceiptDivider />
          <section className="receipt-section min-w-0">
            <div className="receipt-items-header mb-1.5 grid grid-cols-12 gap-1">
              <span className="col-span-6 min-w-0 receipt-meta-label">{t('receipt.item')}</span>
              <span className="col-span-2 min-w-0 text-center receipt-meta-label">{t('receipt.qty')}</span>
              <span className="col-span-4 min-w-0 text-right receipt-meta-label">{t('receipt.lineTotal')}</span>
            </div>

            <div className="space-y-2.5">
              {(sale.items ?? []).map((item, idx) => {
                const rate = item.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
                const taxAmt = item.taxAmount != null ? Number(item.taxAmount) : 0;
                return (
                  <div key={idx} className="border-b border-dotted border-black pb-2 last:border-0">
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-6 min-w-0 break-words">{item.productName}</span>
                      <span className="col-span-2 min-w-0 text-center">{fmtQty(item.quantity)}</span>
                      <span className="col-span-4 min-w-0 text-right">{fmtMoney(item.lineTotal)}</span>
                    </div>
                    {isOn('itemVatLine') && taxAmt > 0 ? (
                      <p className="mt-0.5 receipt-secondary">
                        {t('fiscalReceipt.vatLineShort', { rate: rate.toFixed(0) })} ({fmtMoney(taxAmt)})
                      </p>
                    ) : isOn('itemVatLine') && rate === 0 ? (
                      <p className="mt-0.5 receipt-secondary">
                        {t('fiscalReceipt.vatLineShort', { rate: '0' })} ({fmtMoney(0)})
                      </p>
                    ) : null}
                    {isOn('itemIkpu') && item.ikpu ? (
                      <p className="break-all receipt-secondary">
                        {t('receipt.ikpuLine')}: {item.ikpu}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {(isOn('discounts') || isOn('grandTotal') || isOn('vatTotal')) && (
        <>
          <ReceiptDivider />
          <section className="receipt-section space-y-0.5">
            {isOn('discounts') && Number(sale.discountTotal) > 0 ? (
              <Row
                label={t('fiscalReceipt.discountsSum')}
                value={`${fmtMoney(sale.discountTotal)} ${t('fiscalReceipt.currency')}`}
              />
            ) : null}
            {isOn('grandTotal') ? (
              <Row
                label={t('fiscalReceipt.grandTotal')}
                value={`${fmtMoney(sale.totalAmount)} ${t('fiscalReceipt.currency')}`}
                bold
              />
            ) : null}
            {isOn('vatTotal') ? (
              <Row
                label={t('fiscalReceipt.vatTotalLine', { rate: vatRateLabel })}
                value={`${fmtMoney(sale.taxTotal)} ${t('fiscalReceipt.currency')}`}
                bold
              />
            ) : null}
          </section>
        </>
      )}

      {isOn('payment') ? (
        <>
          <div className="receipt-divider my-2 border-t border-dotted border-black" />
          <section className="receipt-section space-y-0.5">
            <Row
              label={t('fiscalReceipt.paymentForm')}
              value={`${fmtMoney(paidTotal)} ${t('fiscalReceipt.currency')}`}
            />
            {cashAmt > 0 ? (
              <Row label={t('fiscalReceipt.cash')} value={`${fmtMoney(cashAmt)} ${t('fiscalReceipt.currency')}`} />
            ) : null}
            {cardAmt > 0 ? (
              <Row label={t('fiscalReceipt.plastic')} value={`${fmtMoney(cardAmt)} ${t('fiscalReceipt.currency')}`} />
            ) : null}
            {method !== 'CASH' && method !== 'MIXED' && cardAmt === 0 && cashAmt === 0 ? (
              <Row label={payLabel(method)} value={`${fmtMoney(total)} ${t('fiscalReceipt.currency')}`} />
            ) : null}
            {change > 0 ? (
              <Row label={t('receipt.change')} value={`${fmtMoney(change)} ${t('fiscalReceipt.currency')}`} bold />
            ) : null}
          </section>
        </>
      ) : null}

      {isOn('fiscalBlock') ? (
        <>
          <div className="receipt-divider my-2 border-t border-dotted border-black" />
          <section className="receipt-section space-y-1">
            <p className="receipt-section-title">{t('fiscalReceipt.fiscalSection')}</p>
            <Row label={t('fiscalReceipt.virtualRegister')} value={virtualRegister} />
            <Row label={t('fiscalReceipt.fmNumber')} value={fmNumber} />
            <Row label={t('fiscalReceipt.fiscalReceiptNo')} value={`№${sale.receiptNumber}`} />
            <div className="receipt-row flex justify-between gap-2">
              <span className="receipt-meta-label min-w-0 shrink-0">{t('fiscalReceipt.fiscalSign')}</span>
              <span className="receipt-fiscal-sign min-w-0 break-all text-right">{fiscalSign}</span>
            </div>
          </section>
        </>
      ) : null}

      {(isOn('qrCode') || isOn('footer')) && (
        <footer className="receipt-section mt-4 border-t border-dashed border-black pt-3 text-center">
          {isOn('qrCode') ? <ReceiptQrCode value={qrValue} sizePx={112} /> : null}
          {isOn('footer') ? (
            <>
              <p className="receipt-footer mt-2">{t('fiscalReceipt.footer')}</p>
              <p className="receipt-footer receipt-secondary mt-1">{t('fiscalReceipt.qrHint')}</p>
            </>
          ) : null}
        </footer>
      )}
    </div>
  );
}
