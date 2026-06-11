import TablePagination from '../../../components/shared/TablePagination';
import { BaseButton, BaseInput, BaseTable, BaseSelect, ErrorBanner, PageLayout } from '../../../components/ui';
import { useFinanceSyncPage } from '../hooks/useFinanceSyncPage';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/sync.css';

function formatInstant(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusClass(status) {
  if (status === 'SENT') return 'finance-sync-status--sent';
  if (status === 'FAILED') return 'finance-sync-status--failed';
  return 'finance-sync-status--pending';
}

export default function FinanceSyncPage() {
  const p = useFinanceSyncPage();
  const rows = p.outboxQuery.data?.content ?? [];

  return (
    <PageLayout
      title={p.t('finance.sync.title')}
      subtitle={p.t('finance.sync.subtitle')}
      actions={(
        <BaseButton
          variant="secondary"
          onClick={() => p.retryBatchMutation.mutate()}
          disabled={p.retryBatchMutation.isPending}
        >
          {p.t('finance.sync.retryPending')}
        </BaseButton>
      )}
    >
      <div className="finance-page">
        <section className="finance-sync-backfill">
          <h2 className="finance-sync-backfill__title">{p.t('finance.sync.backfillTitle')}</h2>
          <p className="finance-sync-backfill__hint">{p.t('finance.sync.backfillHint')}</p>
          <div className="finance-filters">
            <div className="finance-filters__field">
              <BaseInput type="date" label={p.t('finance.reports.from')} value={p.backfillFrom} onChange={(e) => p.setBackfillFrom(e.target.value)} />
            </div>
            <div className="finance-filters__field">
              <BaseInput type="date" label={p.t('finance.reports.to')} value={p.backfillTo} onChange={(e) => p.setBackfillTo(e.target.value)} />
            </div>
            <label className="finance-form__label finance-form__label--checkbox">
              <input type="checkbox" checked={p.backfillSales} onChange={(e) => p.setBackfillSales(e.target.checked)} />
              {p.t('finance.sync.backfillSales')}
            </label>
            <label className="finance-form__label finance-form__label--checkbox">
              <input type="checkbox" checked={p.backfillPurchases} onChange={(e) => p.setBackfillPurchases(e.target.checked)} />
              {p.t('finance.sync.backfillPurchases')}
            </label>
            <BaseButton
              onClick={() => p.backfillMutation.mutate()}
              disabled={!p.backfillFrom || !p.backfillTo || p.backfillMutation.isPending || (!p.backfillSales && !p.backfillPurchases)}
            >
              {p.t('finance.sync.runBackfill')}
            </BaseButton>
          </div>
        </section>

        <section className="finance-sync-outbox">
          <div className="finance-sync-outbox__header">
            <h2 className="finance-sync-outbox__title">{p.t('finance.sync.outboxTitle')}</h2>
            <BaseSelect
              label={p.t('finance.sync.statusFilter')}
              value={p.status}
              onChange={(e) => { p.setStatus(e.target.value); p.setPage(0); }}
              placeholder={p.t('finance.sync.allStatuses')}
              options={[
                { value: '', label: p.t('finance.sync.allStatuses') },
                { value: 'PENDING', label: p.t('finance.sync.statusPending') },
                { value: 'FAILED', label: p.t('finance.sync.statusFailed') },
                { value: 'SENT', label: p.t('finance.sync.statusSent') },
              ]}
            />
          </div>

          {p.outboxQuery.isError ? <ErrorBanner message={p.t('common.loadError')} /> : null}

          <BaseTable
            isLoading={p.outboxQuery.isLoading}
            isEmpty={!p.outboxQuery.isLoading && rows.length === 0}
            emptyMessage={p.t('finance.sync.outboxEmpty')}
            colSpan={6}
            footer={(
              <TablePagination
                className="finance-pagination"
                page={p.page}
                pageSize={p.pageSize}
                total={p.outboxQuery.data?.totalElements ?? 0}
                totalPages={p.outboxQuery.data?.totalPages}
                onPageChange={p.setPage}
                onPageSizeChange={p.setPageSize}
              />
            )}
          >
            <table className="finance-table">
              <thead>
                <tr>
                  <th>{p.t('finance.sync.colEvent')}</th>
                  <th>{p.t('finance.sync.colStatus')}</th>
                  <th>{p.t('finance.sync.colAttempts')}</th>
                  <th>{p.t('finance.sync.colCreated')}</th>
                  <th>{p.t('finance.sync.colError')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="finance-sync-event">
                        <strong>{row.eventType}</strong>
                        <span>{row.idempotencyKey}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`finance-sync-status ${statusClass(row.status)}`}>{row.status}</span>
                    </td>
                    <td>{row.attempts ?? 0}</td>
                    <td>{formatInstant(row.createdAt)}</td>
                    <td className="finance-sync-error">{row.lastError || '—'}</td>
                    <td className="finance-cell-actions">
                      {row.status !== 'SENT' ? (
                        <BaseButton
                          size="sm"
                          variant="secondary"
                          onClick={() => p.retryMutation.mutate(row.id)}
                          disabled={p.retryMutation.isPending}
                        >
                          {p.t('finance.sync.retry')}
                        </BaseButton>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BaseTable>
        </section>
      </div>
    </PageLayout>
  );
}
