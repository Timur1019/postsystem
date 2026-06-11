import TablePagination from '../../../components/shared/TablePagination';
import { BaseButton, BaseInput, BaseModal, BaseSelect, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceBulkConfirmModal from '../components/FinanceBulkConfirmModal';
import FinanceBulkToolbar from '../components/FinanceBulkToolbar';
import FinanceListFilters from '../components/FinanceListFilters';
import FinanceRowActions from '../components/FinanceRowActions';
import FinanceSelectHeader, { FinanceSelectCell } from '../components/FinanceSelectHeader';
import { useFinanceIncomesPage } from '../hooks/useFinanceIncomesPage';
import { formatMoney } from '../utils/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/bulk-actions.css';

export default function FinanceIncomesPage() {
  const p = useFinanceIncomesPage();
  const deleteCount = p.bulkDeleteOpen ? p.selectedDeletable.length : (p.deleteTarget ? 1 : 0);

  return (
    <PageLayout
      title={p.t('finance.incomes.title')}
      actions={<BaseButton onClick={() => { p.resetForm(); p.setModalOpen(true); }}>{p.t('finance.incomes.add')}</BaseButton>}
    >
      <div className="finance-page">
        <FinanceListFilters
          t={p.t}
          from={p.filters.from}
          setFrom={p.filters.setFrom}
          to={p.filters.to}
          setTo={p.filters.setTo}
          paymentMethod={p.filters.paymentMethod}
          setPaymentMethod={p.filters.setPaymentMethod}
          onReset={p.filters.resetFilters}
          showPaymentMethod
        />

        <FinanceBulkToolbar
          t={p.t}
          count={p.selectedDeletable.length}
          onDelete={() => p.setBulkDeleteOpen(true)}
          isPending={p.bulkDeleteMutation.isPending}
        />

        {p.incomesQuery.isError || p.accountsQuery.isError || p.categoriesQuery.isError ? (
          <ErrorBanner message={p.t('common.loadError')} />
        ) : null}

        <BaseTable
          isLoading={p.incomesQuery.isLoading}
          isEmpty={!p.incomesQuery.isLoading && p.rows.length === 0}
          emptyMessage={p.t('finance.incomes.empty')}
          colSpan={6}
          footer={(
            <TablePagination
              className="finance-pagination"
              page={p.page}
              pageSize={p.pageSize}
              total={p.incomesQuery.data?.totalElements ?? 0}
              totalPages={p.incomesQuery.data?.totalPages}
              onPageChange={p.setPage}
              onPageSizeChange={p.setPageSize}
            />
          )}
        >
          <table className="finance-table">
            <thead>
              <tr>
                <FinanceSelectHeader
                  selectAllRef={p.selection.selectAllRef}
                  checked={p.allSelectableSelected}
                  onChange={p.toggleSelectAllEditable}
                  disabled={p.selectableRows.length === 0}
                />
                <th>{p.t('finance.common.date')}</th>
                <th>{p.t('finance.common.category')}</th>
                <th>{p.t('finance.common.account')}</th>
                <th>{p.t('finance.common.amount')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.rows.map((row) => {
                const editable = p.isEditable(row);
                return (
                  <tr key={row.id}>
                    <FinanceSelectCell
                      checked={p.selection.selectedIds.has(row.id)}
                      onChange={() => p.selection.toggleSelect(row.id)}
                      disabled={!editable}
                    />
                    <td>{row.transactionDate}</td>
                    <td>{row.incomeCategoryName}</td>
                    <td>{row.accountName}</td>
                    <td className="finance-amount--income">{formatMoney(row.amount, row.currency)}</td>
                    <td className="finance-cell-actions">
                      {editable ? (
                        <FinanceRowActions
                          t={p.t}
                          onEdit={() => p.openEdit(row)}
                          onDelete={() => p.openDelete(row)}
                        />
                      ) : (
                        <span className="finance-badge finance-badge--muted">{row.sourceType}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </BaseTable>
      </div>

      <BaseModal
        open={p.modalOpen}
        onClose={() => { p.setModalOpen(false); p.resetForm(); }}
        title={p.editingId ? p.t('finance.incomes.edit') : p.t('finance.incomes.add')}
        size="lg"
        className="finance-modal"
        bodyClassName="finance-modal__body"
      >
        <div className="finance-form">
          <BaseInput label={p.t('finance.common.amount')} type="number" value={p.form.amount} onChange={(e) => p.setForm({ ...p.form, amount: e.target.value })} />
          <BaseInput label={p.t('finance.common.date')} type="date" value={p.form.transactionDate} onChange={(e) => p.setForm({ ...p.form, transactionDate: e.target.value })} />
          <BaseSelect
            label={p.t('finance.common.account')}
            value={p.form.accountId}
            onChange={(e) => p.setForm({ ...p.form, accountId: e.target.value })}
            placeholder={p.t('common.select')}
            options={[
              { value: '', label: p.t('common.select') },
              ...(p.accountsQuery.data ?? []).map((a) => ({ value: String(a.id), label: a.name })),
            ]}
          />
          <BaseSelect
            label={p.t('finance.common.category')}
            value={p.form.incomeCategoryId}
            onChange={(e) => p.setForm({ ...p.form, incomeCategoryId: e.target.value })}
            placeholder={p.t('common.select')}
            options={[
              { value: '', label: p.t('common.select') },
              ...(p.categoriesQuery.data ?? []).filter((c) => c.active).map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
          <BaseInput label={p.t('finance.common.comment')} value={p.form.comment} onChange={(e) => p.setForm({ ...p.form, comment: e.target.value })} />
          <div className="finance-form__actions">
            <BaseButton variant="secondary" onClick={() => { p.setModalOpen(false); p.resetForm(); }}>{p.t('common.cancel')}</BaseButton>
            <BaseButton onClick={p.submit} disabled={!p.form.amount || !p.form.accountId || !p.form.incomeCategoryId}>{p.t('common.save')}</BaseButton>
          </div>
        </div>
      </BaseModal>

      <FinanceBulkConfirmModal
        open={p.bulkDeleteOpen || !!p.deleteTarget}
        onClose={() => { p.setBulkDeleteOpen(false); p.setDeleteTarget(null); }}
        title={p.t('finance.bulk.deleteTitle')}
        hint={p.t('finance.bulk.deleteHint', { count: deleteCount })}
        note={p.t('finance.incomes.deleteConfirm')}
        confirmLabel={p.t('finance.bulk.delete')}
        cancelLabel={p.t('common.cancel')}
        onConfirm={p.confirmDelete}
        isPending={p.bulkDeleteMutation.isPending}
      />
    </PageLayout>
  );
}
