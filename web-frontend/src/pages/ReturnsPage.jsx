// src/pages/ReturnsPage.jsx
import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Info, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { returnApi, storeApi } from '../services/api';
import ReturnsFiltersDrawer from '../components/reports/ReturnsFiltersDrawer';

const fmtMoney = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

const defaultFilters = {
  storeId: '',
  cashierName: '',
  dateFrom: '',
  dateTo: '',
};

function escapeHtml(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function ReturnsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      fiscalSearch: search.trim() || undefined,
      from: applied.dateFrom || undefined,
      to: applied.dateTo || undefined,
      cashierName: applied.cashierName.trim() || undefined,
    }),
    [search, page, pageSize, applied]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['returns', queryParams],
    queryFn: () => returnApi.getAll(queryParams).then((r) => r.data),
    placeholderData: { content: [], totalPages: 0, totalElements: 0 },
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const fmtAt = useCallback(
    (iso) => {
      try {
        return format(typeof iso === 'string' ? parseISO(iso) : new Date(iso), 'dd.MM.yyyy HH:mm');
      } catch {
        return '—';
      }
    },
    []
  );

  const printReport = useCallback(() => {
    const title = t('returnsModule.printTitle');
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) {
      toast.error(t('returnsModule.printBlocked'));
      return;
    }
    const headers = [
      t('returnsModule.colDate'),
      t('returnsModule.colFiscal'),
      t('returnsModule.colAmount'),
      t('returnsModule.colPositions'),
      t('returnsModule.colStore'),
    ];
    const headRow = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
    const bodyRows = rows
      .map(
        (row) => `<tr>
      <td>${escapeHtml(fmtAt(row.createdAt))}</td>
      <td class="mono">${escapeHtml(row.fiscalModuleId)}</td>
      <td class="num">${escapeHtml(fmtMoney(row.totalAmount))}</td>
      <td class="num">${escapeHtml(String(row.positionsCount ?? 0))}</td>
      <td>${escapeHtml(row.storeName ?? '—')}</td>
    </tr>`
      )
      .join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;padding:20px;color:#111;}
  h1{font-size:18px;margin:0 0 16px;}
  table{border-collapse:collapse;width:100%;font-size:12px;}
  th,td{border:1px solid #ccc;padding:8px;}
  th{background:#f4f4f5;text-align:left;}
  td.num,th:nth-child(3),th:nth-child(4){text-align:right;}
  td.mono{font-family:ui-monospace,monospace;font-size:11px;}
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<table><thead><tr>${headRow}</tr></thead><tbody>${bodyRows}</tbody></table>
<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},300);});<\/script>
</body></html>`);
    win.document.close();
  }, [rows, t, fmtAt]);

  const loading = isPending;
  const showEmptyHint = !loading && !isError && rows.length === 0;

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error?.response?.status === 403
            ? t('returnsModule.forbidden')
            : error?.response?.data?.message ?? error?.message ?? t('returnsModule.loadError')}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('returnsModule.title')}</h1>
        <button
          type="button"
          onClick={printReport}
          disabled={rows.length === 0}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <Printer size={16} />
          {t('returnsModule.print')}
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={t('returnsModule.searchPh')}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600"
        >
          <Filter size={16} />
          {t('products.toolbar.filters')}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-4 py-3">{t('returnsModule.colDate')}</th>
                <th className="px-4 py-3">{t('returnsModule.colFiscal')}</th>
                <th className="px-4 py-3 text-right">{t('returnsModule.colAmount')}</th>
                <th className="px-4 py-3 text-right">{t('returnsModule.colPositions')}</th>
                <th className="px-4 py-3">{t('returnsModule.colStore')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : showEmptyHint ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="m-4 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                      <Info className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" size={20} />
                      <p>{t('returnsModule.emptyHint')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr
                    key={`${row.fiscalModuleId}-${idx}`}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{fmtAt(row.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {row.fiscalModuleId}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                      {fmtMoney(row.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{row.positionsCount}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.storeName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-500">
              {t('common.pageOf', { current: page + 1, total: data.totalPages })} · {total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded bg-slate-200 px-3 py-1 text-xs text-slate-800 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300"
              >
                {t('common.prev')}
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded bg-slate-200 px-3 py-1 text-xs text-slate-800 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      <ReturnsFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        stores={stores}
        onReset={() => {
          const f = { ...defaultFilters };
          setFilters(f);
          setApplied(f);
          setPage(0);
        }}
        onApply={() => {
          setApplied({ ...filters });
          setPage(0);
          setFiltersOpen(false);
        }}
      />
    </div>
  );
}
