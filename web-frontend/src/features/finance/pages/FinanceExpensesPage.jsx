import TablePagination from '../../../components/shared/TablePagination';
import { BaseButton, BaseInput, BaseModal, BaseSelect, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceBulkConfirmModal from '../components/FinanceBulkConfirmModal';
import FinanceBulkToolbar from '../components/FinanceBulkToolbar';
import FinanceListFilters from '../components/FinanceListFilters';
import FinanceRowActions from '../components/FinanceRowActions';
import FinanceSelectHeader, { FinanceSelectCell } from '../components/FinanceSelectHeader';
import { useFinanceExpensesPage } from '../hooks/useFinanceExpensesPage';
import { formatMoney } from '../utils/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/bulk-actions.css';

export default function FinanceExpensesPage() {
  const p = useFinanceExpensesPage();
  const deleteCount = p.bulkDeleteOpen ? p.selectedDeletable.length : (p.deleteTarget ? 1 : 0);
  const deletePending = p.bulkDeleteMutation.isPending || p.deleteMutation.isPending;

  return (
    <PageLayout
      title={p.t('finance.expenses.title')}
      actions={<BaseButton onClick={p.openCreate}>{p.t('finance.expenses.add')}</BaseButton>}
    >
      <div className="finance-page">
        <FinanceListFilters
          t={p.t}
          from={p.filters.from}
          setFrom={p.filters.setFrom}
          to={p.filters.to}
          setTo={p.filters.setTo}
          categoryId={p.filters.categoryId}
          setCategoryId={p.filters.setCategoryId}
          categories={(p.categoriesQuery.data ?? []).filter((c) => c.active)}
          paymentMethod={p.filters.paymentMethod}
          setPaymentMethod={p.filters.setPaymentMethod}
          onReset={p.filters.resetFilters}
          showCategory
          showPaymentMethod
        />

        <FinanceBulkToolbar
          t={p.t}
          count={p.selectedDeletable.length}
          onDelete={() => p.setBulkDeleteOpen(true)}
          isPending={p.bulkDeleteMutation.isPending}
        />

        {p.expensesQuery.isError || p.accountsQuery.isError || p.categoriesQuery.isError ? (
          <ErrorBanner message={p.t('common.loadError')} />
        ) : null}

        <BaseTable
          isLoading={p.expensesQuery.isLoading}
          isEmpty={!p.expensesQuery.isLoading && p.rows.length === 0}
          emptyMessage={p.t('finance.expenses.empty')}
          colSpan={6}
          footer={(
            <TablePagination
              className="finance-pagination"
              page={p.page}
              pageSize={p.pageSize}
              total={p.expensesQuery.data?.totalElements ?? 0}
              totalPages={p.expensesQuery.data?.totalPages}
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
                  <tr key={row.id} className={p.selection.selectedIds.has(row.id) ? 'finance-table__row--selected' : ''}>
                    <FinanceSelectCell
                      checked={p.selection.selectedIds.has(row.id)}
                      onChange={() => p.selection.toggleSelect(row.id)}
                      disabled={!editable}
                    />
                    <td>{row.transactionDate}</td>
                    <td>{row.expenseCategoryName}</td>
                    <td>{row.accountName}</td>
                    <td className="finance-amount--expense">{formatMoney(row.amount, row.currency)}</td>
                    <td className="finance-cell-actions">
                      {editable ? (
                        <FinanceRowActions
                          t={p.t}
                          onEdit={() => p.openEdit(row)}
                          onDelete={() => p.openDelete(row)}
                          canToggle={false}
                          deletePending={deletePending}
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
        title={p.editingId ? p.t('finance.expenses.edit') : p.t('finance.expenses.add')}
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
            value={p.form.expenseCategoryId}
            onChange={(e) => p.setForm({ ...p.form, expenseCategoryId: e.target.value })}
            placeholder={p.t('common.select')}
            options={[
              { value: '', label: p.t('common.select') },
              ...(p.categoriesQuery.data ?? []).filter((c) => c.active).map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
          <BaseSelect
            label={p.t('finance.common.paymentMethod')}
            value={p.form.paymentMethod}
            onChange={(e) => p.setForm({ ...p.form, paymentMethod: e.target.value })}
            options={[
              { value: 'CASH', label: p.t('finance.payment.cash') },
              { value: 'CARD', label: p.t('finance.payment.card') },
              { value: 'BANK', label: p.t('finance.payment.bank') },
            ]}
          />
          {!p.editingId && p.isSalaryCategory ? (
            <BaseSelect
              label={p.t('finance.expenses.employee')}
              value={p.form.employeeId}
              onChange={(e) => p.setForm({ ...p.form, employeeId: e.target.value })}
              placeholder={p.t('common.select')}
              options={[
                { value: '', label: p.t('common.select') },
                ...(p.usersQuery.data ?? []).map((u) => ({ value: String(u.id), label: u.fullName })),
              ]}
            />
          ) : null}
          <BaseInput label={p.t('finance.common.comment')} value={p.form.comment} onChange={(e) => p.setForm({ ...p.form, comment: e.target.value })} />
          <div className="finance-form__actions">
            <BaseButton variant="secondary" onClick={() => { p.setModalOpen(false); p.resetForm(); }}>{p.t('common.cancel')}</BaseButton>
            <BaseButton onClick={p.submit} disabled={!p.form.amount || !p.form.accountId || !p.form.expenseCategoryId || p.createMutation.isPending || p.updateMutation.isPending}>
              {p.t('common.save')}
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      <FinanceBulkConfirmModal
        open={p.bulkDeleteOpen || !!p.deleteTarget}
        onClose={() => { p.setBulkDeleteOpen(false); p.setDeleteTarget(null); }}
        title={p.t('finance.bulk.deleteTitle')}
        hint={p.t('finance.bulk.deleteHint', { count: deleteCount })}
        note={p.t('finance.expenses.deleteConfirm')}
        confirmLabel={p.t('finance.bulk.delete')}
        cancelLabel={p.t('common.cancel')}
        onConfirm={p.confirmDelete}
        isPending={deletePending}
      />
    </PageLayout>
  );
}
