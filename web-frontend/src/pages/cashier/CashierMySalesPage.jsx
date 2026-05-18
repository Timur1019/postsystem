// src/pages/cashier/CashierMySalesPage.jsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ChevronDown, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { cashierShiftApi, saleApi } from '../../services/api';
import { useCashierStore } from '../../hooks/useCashierStore';

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

function SalesTable({ rows, isPending, onReturn, voidPending, onRowClick, t }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800/50">
          <th className="px-4 py-3">{t('pos.receipt')}</th>
          <th className="px-4 py-3">{t('pos.date')}</th>
          <th className="px-4 py-3">{t('pos.total')}</th>
          <th className="px-4 py-3">{t('pos.payment')}</th>
          <th className="px-4 py-3 w-28" />
        </tr>
      </thead>
      <tbody className="divide-y dark:divide-slate-800">
        {isPending ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center">
              {t('common.loading')}
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
              {t('pos.noSales')}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              onClick={() => onRowClick(row)}
            >
              <td className="px-4 py-3 font-mono text-xs">
                {row.receiptNumber}
                {row.status === 'VOIDED' && (
                  <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    {t('pos.statusVoided')}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                {row.createdAt ? format(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
              </td>
              <td className="px-4 py-3 font-semibold">{fmt(row.totalAmount)}</td>
              <td className="px-4 py-3">{row.paymentMethod}</td>
              <td className="px-4 py-3">
                {row.status !== 'VOIDED' && onReturn && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
                    onClick={(e) => onReturn(row, e)}
                    disabled={voidPending}
                  >
                    {t('pos.return')}
                  </button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default function CashierMySalesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { storeId } = useCashierStore();
  const [showOtherSales, setShowOtherSales] = useState(false);

  const { data: shift, isPending: shiftLoading } = useQuery({
    queryKey: ['cashier-shift', storeId],
    queryFn: () => cashierShiftApi.current(storeId).then((r) => r.data),
    enabled: !!storeId,
    retry: 1,
  });

  const shiftId = shift?.id;

  const { data: shiftSales, isPending: shiftSalesLoading } = useQuery({
    queryKey: ['my-sales', 'shift', shiftId],
    queryFn: () => saleApi.mySales({ page: 0, size: 50, shiftId }).then((r) => r.data),
    enabled: !!shiftId,
  });

  const { data: otherSales, isPending: otherSalesLoading } = useQuery({
    queryKey: ['my-sales', 'other', shiftId],
    queryFn: () => saleApi.mySales({ page: 0, size: 50, excludeShiftId: shiftId }).then((r) => r.data),
    enabled: !!shiftId,
  });

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }) => saleApi.voidSale(id, reason),
    onSuccess: () => {
      toast.success(t('pos.returnSuccess'));
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pos.returnFailed')),
  });

  const handleReturn = (row, e) => {
    e.stopPropagation();
    if (row.status === 'VOIDED') return;
    const reason = window.prompt(t('pos.returnReason'), t('pos.returnDefaultReason'));
    if (reason == null) return;
    voidMutation.mutate({ id: row.id, reason });
  };

  const shiftRows = shiftSales?.content ?? [];
  const otherRows = otherSales?.content ?? [];
  const otherTotal = otherSales?.totalElements ?? 0;

  const shiftOpenedLabel =
    shift?.openedAt != null
      ? format(new Date(shift.openedAt), 'dd.MM.yyyy HH:mm')
      : '—';

  return (
    <div className="cashier-page space-y-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('pos.mySalesTitle')}</h1>

      {shiftLoading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : !shiftId ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          {t('pos.shiftRequired')}
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-900 dark:text-emerald-200">
              <Clock size={18} className="shrink-0 opacity-80" />
              <div>
                <p className="font-semibold">{t('pos.currentShiftSales')}</p>
                <p className="text-xs opacity-90">
                  {t('pos.shiftOpenedAt', { time: shiftOpenedLabel })}
                  {' · '}
                  {shift?.saleCount ?? 0} {t('pos.shiftSales').toLowerCase()}
                  {' · '}
                  {fmt(shift?.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <SalesTable
              rows={shiftRows}
              isPending={shiftSalesLoading}
              onReturn={handleReturn}
              voidPending={voidMutation.isPending}
              onRowClick={(row) => navigate(`/receipt/${row.receiptNumber}`)}
              t={t}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setShowOtherSales((v) => !v)}
              className="flex w-full items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>
                {showOtherSales ? t('pos.hideOtherSales') : t('pos.showOtherSales')}
                {!showOtherSales && otherTotal > 0 && (
                  <span className="ml-2 text-xs font-normal text-slate-500">({otherTotal})</span>
                )}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-slate-500 transition-transform ${showOtherSales ? 'rotate-180' : ''}`}
              />
            </button>
            {showOtherSales && (
              <SalesTable
                rows={otherRows}
                isPending={otherSalesLoading}
                onReturn={handleReturn}
                voidPending={voidMutation.isPending}
                onRowClick={(row) => navigate(`/receipt/${row.receiptNumber}`)}
                t={t}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

