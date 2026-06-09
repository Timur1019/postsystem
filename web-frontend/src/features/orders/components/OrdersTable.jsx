import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoney } from '../../../utils/formatMoney';
import { fmtOrderDateTime, orderStatusLabel } from '../utils/ordersDisplayUtils';

const COL_COUNT = 9;

export default function OrdersTable({
  t,
  rows,
  loading,
  isError,
  errorMessage,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            <tr>
              <th className="w-10 px-3 py-3">
                <input type="checkbox" disabled className="rounded border-slate-300" aria-label="select" />
              </th>
              <th className="px-3 py-3">{t('orders.colOrderDate')}</th>
              <th className="px-3 py-3">{t('orders.colReceiptSale')}</th>
              <th className="px-3 py-3">{t('orders.colExternal')}</th>
              <th className="px-3 py-3">{t('orders.colPayment')}</th>
              <th className="px-3 py-3">{t('orders.colClient')}</th>
              <th className="px-3 py-3">{t('orders.colCourier')}</th>
              <th className="px-3 py-3 text-right">{t('orders.colTotal')}</th>
              <th className="px-3 py-3">{t('orders.colStatus')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                  {t('common.loading')}
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3 py-8 text-center text-red-600 dark:text-red-400">
                  {errorMessage}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3 py-0">
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-6 text-center text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
                    {t('orders.emptyBanner')}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-3">
                    <input type="checkbox" disabled className="rounded border-slate-300" aria-label="select" />
                  </td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">
                    <div className="font-medium">{row.id}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{fmtOrderDateTime(row.createdAt)}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">
                    <div>{row.receiptNumber ?? '—'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {row.receiptAt ? fmtOrderDateTime(row.receiptAt) : '—'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{row.externalNumber ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{row.paymentMethod ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{row.clientName ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{row.courierName ?? '—'}</td>
                  <td className="px-3 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {fmtMoney(row.totalAmount)}
                  </td>
                  <td className="px-3 py-3 text-slate-800 dark:text-slate-100">{orderStatusLabel(t, row.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
