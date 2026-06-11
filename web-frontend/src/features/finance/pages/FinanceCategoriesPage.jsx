import TablePagination from '../../../components/shared/TablePagination';
import { BaseButton, BaseInput, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceBulkConfirmModal from '../components/FinanceBulkConfirmModal';
import FinanceBulkToolbar from '../components/FinanceBulkToolbar';
import FinanceRowActions from '../components/FinanceRowActions';
import FinanceSelectHeader, { FinanceSelectCell } from '../components/FinanceSelectHeader';
import { useClientTablePagination } from '../hooks/useClientTablePagination';
import { useFinanceCategoriesPage } from '../hooks/useFinanceCategoriesPage';
import { isSelectableCategory } from '../utils/financeRowRules';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/bulk-actions.css';

export default function FinanceCategoriesPage() {
  const p = useFinanceCategoriesPage();
  const pagination = useClientTablePagination(p.allRows, { initialPageSize: 14, resetKey: p.tab });
  const bulkCount = p.selectedCustom.length;
  const isEnable = p.bulkAction === 'enable';

  return (
    <PageLayout title={p.t('finance.categories.title')}>
      <div className="finance-page">
        <div className="finance-toolbar">
          <div className="finance-tabs">
            <button type="button" className={`finance-tabs__btn ${p.tab === 'income' ? 'finance-tabs__btn--active' : ''}`} onClick={() => p.setTab('income')}>{p.t('finance.categories.income')}</button>
            <button type="button" className={`finance-tabs__btn ${p.tab === 'expense' ? 'finance-tabs__btn--active' : ''}`} onClick={() => p.setTab('expense')}>{p.t('finance.categories.expense')}</button>
          </div>
        </div>

        <div className="finance-inline-form">
          <div className="finance-inline-form__field">
            <BaseInput label={p.t('finance.categories.newName')} value={p.name} onChange={(e) => p.setName(e.target.value)} />
          </div>
          <BaseButton onClick={p.submit} disabled={!p.name.trim()}>{p.t('common.add')}</BaseButton>
        </div>

        <FinanceBulkToolbar
          t={p.t}
          count={bulkCount}
          onEnable={() => p.setBulkAction('enable')}
          onDisable={() => p.setBulkAction('disable')}
          isPending={p.bulkToggleMutation.isPending}
        />

        {p.incomeQuery.isError || p.expenseQuery.isError ? <ErrorBanner message={p.t('common.loadError')} /> : null}

        <BaseTable
          className="finance-panel"
          isLoading={p.tab === 'income' ? p.incomeQuery.isLoading : p.expenseQuery.isLoading}
          isEmpty={!pagination.rows.length && !(p.tab === 'income' ? p.incomeQuery.isLoading : p.expenseQuery.isLoading)}
          emptyMessage={p.t('common.noData')}
          colSpan={5}
          footer={pagination.total > pagination.pageSize ? (
            <TablePagination
              className="finance-pagination"
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          ) : null}
        >
          <table className="finance-table">
            <thead>
              <tr>
                <FinanceSelectHeader
                  selectAllRef={p.selection.selectAllRef}
                  checked={p.allSelectableSelected}
                  onChange={p.toggleSelectAllCustom}
                  disabled={p.selectableRows.length === 0}
                />
                <th>{p.t('finance.categories.name')}</th>
                <th>{p.t('finance.categories.system')}</th>
                <th>{p.t('finance.accounts.status')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagination.rows.map((row) => {
                const selectable = isSelectableCategory(row);
                return (
                  <tr key={row.id}>
                    <FinanceSelectCell
                      checked={p.selection.selectedIds.has(row.id)}
                      onChange={() => p.selection.toggleSelect(row.id)}
                      disabled={!selectable}
                    />
                    <td>{row.name}</td>
                    <td>
                      <span className={`finance-badge ${row.system ? 'finance-badge--info' : 'finance-badge--muted'}`}>
                        {row.system ? p.t('common.yes') : p.t('common.no')}
                      </span>
                    </td>
                    <td>
                      <span className={`finance-badge ${row.active ? 'finance-badge--success' : 'finance-badge--muted'}`}>
                        {row.active ? p.t('common.active') : p.t('common.inactive')}
                      </span>
                    </td>
                    <td className="finance-cell-actions">
                      {selectable ? (
                        <FinanceRowActions
                          t={p.t}
                          onToggle={() => p.toggleRow(row)}
                          isActive={row.active}
                          canEdit={false}
                          canDelete={false}
                          canToggle
                        />
                      ) : (
                        <span className="finance-badge finance-badge--muted">{p.t('finance.categories.system')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </BaseTable>
      </div>

      <FinanceBulkConfirmModal
        open={!!p.bulkAction}
        onClose={() => p.setBulkAction(null)}
        title={isEnable ? p.t('finance.bulk.enableTitle') : p.t('finance.bulk.disableTitle')}
        hint={isEnable ? p.t('finance.bulk.enableHint', { count: bulkCount }) : p.t('finance.bulk.disableHint', { count: bulkCount })}
        confirmLabel={isEnable ? p.t('finance.bulk.enable') : p.t('finance.bulk.disable')}
        cancelLabel={p.t('common.cancel')}
        onConfirm={p.confirmBulkAction}
        isPending={p.bulkToggleMutation.isPending}
        variant={isEnable ? 'primary' : 'danger'}
      />
    </PageLayout>
  );
}
