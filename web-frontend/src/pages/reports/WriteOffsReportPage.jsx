import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { Plus } from 'lucide-react';
import { stockReportApi, storeApi, productApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import TablePagination from '../../components/shared/TablePagination';
import WriteOffModal from '../../components/stock/WriteOffModal';
import { fmtMoney } from '../../utils/formatMoney';
import { format as fmtDate } from 'date-fns';

export default function WriteOffsReportPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [pickProduct, setPickProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, page, pageSize, storeId]
  );

  const { data, isPending, refetch } = useQuery({
    queryKey: ['write-offs', params],
    queryFn: () => stockReportApi.writeOffs(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const { data: productPick } = useQuery({
    queryKey: ['write-off-pick', productSearch],
    queryFn: () =>
      productApi.getAll({ search: productSearch.trim(), page: 0, size: 8, activeOnly: true }).then((r) => r.data),
    enabled: writeOffOpen && productSearch.trim().length >= 2,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.writeOffsTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.writeOffsSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => { setWriteOffOpen(true); setPickProduct(null); setProductSearch(''); }}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus size={16} />
          {t('stockReports.newWriteOff')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <select
          value={storeId}
          onChange={(e) => { setStoreId(e.target.value); setPage(0); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">{t('stockReports.allStores')}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3">{t('stockReports.colDate')}</th>
                <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colQty')}</th>
                <th className="px-4 py-3">{t('stockReports.writeOffReason')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colLoss')}</th>
                <th className="px-4 py-3">{t('stockReports.colUser')}</th>
              </tr>
            </thead>
            <tbody>
              {isPending && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('common.loading')}</td></tr>
              )}
              {!isPending && rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('common.noData')}</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.createdAt ? fmtDate(new Date(r.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.productName}</div>
                    <div className="text-xs text-slate-500">{r.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-400">−{r.quantity}</td>
                  <td className="px-4 py-3">{t(`stockReports.reasons.${r.reason}`, { defaultValue: r.reason })}</td>
                  <td className="px-4 py-3 text-right">{fmtMoney(r.lossAmount)}</td>
                  <td className="px-4 py-3 text-slate-600">{r.createdByName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={data?.totalElements ?? 0}
          totalPages={data?.totalPages ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {writeOffOpen && !pickProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-bold">{t('stockReports.pickProduct')}</h2>
            <input
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              placeholder={t('common.search')}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <ul className="mt-3 max-h-48 overflow-y-auto">
              {(productPick?.content ?? []).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setPickProduct(p)}
                  >
                    {p.name} ({p.stockQuantity} {t('stockReports.unitsSuffix')})
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-4 w-full rounded-lg border px-4 py-2 text-sm" onClick={() => setWriteOffOpen(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {pickProduct && (
        <WriteOffModal
          product={pickProduct}
          storeId={storeId === '' ? null : Number(storeId)}
          onClose={() => { setPickProduct(null); setWriteOffOpen(false); }}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}
