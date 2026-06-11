import TablePagination from '../../../components/shared/TablePagination';
import { BaseInput, BaseSelect, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import { financeApi } from '../../../api';
import ReportExportButton from '../../reports/components/ReportExportButton';
import { useFinanceAuditPage } from '../hooks/useFinanceAuditPage';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function FinanceAuditPage() {
  const p = useFinanceAuditPage();
  const rows = p.query.data?.content ?? [];

  return (
    <PageLayout
      title={p.t('finance.audit.title')}
      subtitle={p.t('finance.audit.subtitle')}
      actions={(
        <ReportExportButton
          fetchBlob={() => financeApi.audit.export({
            from: p.from,
            to: p.to,
            entityType: p.entityType || undefined,
          })}
          filenamePrefix="finance-audit"
        />
      )}
    >
      <div className="finance-filters">
        <div className="finance-filters__field">
          <BaseInput type="date" label={p.t('finance.reports.from')} value={p.from} onChange={(e) => p.setFrom(e.target.value)} />
        </div>
        <div className="finance-filters__field">
          <BaseInput type="date" label={p.t('finance.reports.to')} value={p.to} onChange={(e) => p.setTo(e.target.value)} />
        </div>
        <div className="finance-filters__field finance-filters__field--wide">
          <BaseSelect
            label={p.t('finance.audit.entityType')}
            value={p.entityType}
            onChange={(e) => p.setEntityType(e.target.value)}
            placeholder={p.t('finance.audit.allTypes')}
            options={[
              { value: '', label: p.t('finance.audit.allTypes') },
              ...p.entityTypes.map((type) => ({ value: type, label: p.t(`finance.audit.types.${type}`) })),
            ]}
          />
        </div>
      </div>

      {p.query.isError ? <ErrorBanner message={p.t('common.loadError')} /> : null}

      <BaseTable
        isLoading={p.query.isLoading}
        isEmpty={!p.query.isLoading && rows.length === 0}
        emptyMessage={p.t('finance.audit.empty')}
        colSpan={4}
        footer={(
          <TablePagination
            className="finance-pagination"
            page={p.page}
            pageSize={p.pageSize}
            total={p.query.data?.totalElements ?? 0}
            totalPages={p.query.data?.totalPages}
            onPageChange={p.setPage}
            onPageSizeChange={p.setPageSize}
          />
        )}
      >
        <table className="finance-table">
          <thead>
            <tr>
              <th>{p.t('finance.audit.when')}</th>
              <th>{p.t('finance.audit.entityType')}</th>
              <th>{p.t('finance.audit.action')}</th>
              <th>{p.t('finance.audit.summary')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatDateTime(row.createdAt)}</td>
                <td>{p.t(`finance.audit.types.${row.entityType}`, { defaultValue: row.entityType })}</td>
                <td>{p.t(`finance.audit.actions.${row.action}`, { defaultValue: row.action })}</td>
                <td>{row.summary || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </BaseTable>
    </PageLayout>
  );
}
