import TablePagination from '../../../components/shared/TablePagination';
import { BaseButton, BaseInput, BaseModal, BaseSelect, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceBulkConfirmModal from '../components/FinanceBulkConfirmModal';
import FinanceBulkToolbar from '../components/FinanceBulkToolbar';
import FinanceRowActions from '../components/FinanceRowActions';
import FinanceSelectHeader, { FinanceSelectCell } from '../components/FinanceSelectHeader';
import { useClientTablePagination } from '../hooks/useClientTablePagination';
import { useFinanceAccountsPage } from '../hooks/useFinanceAccountsPage';
import { formatMoney } from '../utils/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/accounts.css';
import '../../../styles/finance/bulk-actions.css';

export default function FinanceAccountsPage() {
  const p = useFinanceAccountsPage();
  const pagination = useClientTablePagination(p.allRows, { initialPageSize: 14 });

  return (
    <PageLayout
      title={p.t('finance.accounts.title')}
      subtitle={p.t('finance.accounts.subtitle')}
      actions={<BaseButton onClick={() => p.setModalOpen(true)}>{p.t('finance.accounts.add')}</BaseButton>}
    >
      <div className="finance-page">
        <FinanceBulkToolbar
          t={p.t}
          count={p.selectedActive.length}
          onDisable={() => p.setBulkDisableOpen(true)}
          disableLabel={p.t('finance.bulk.deactivate')}
          isPending={p.bulkDisableMutation.isPending}
        />

        {p.query.isError ? <ErrorBanner message={p.t('common.loadError')} /> : null}

        <BaseTable
          className="finance-panel"
          isLoading={p.query.isLoading}
          isEmpty={!p.query.isLoading && p.allRows.length === 0}
          emptyMessage={p.t('finance.accounts.empty')}
          colSpan={6}
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
                  checked={pagination.rows.length > 0 && pagination.rows.every((r) => p.selection.selectedIds.has(r.id))}
                  onChange={p.selection.toggleSelectAllPage}
                  disabled={pagination.rows.length === 0}
                />
                <th>{p.t('finance.accounts.name')}</th>
                <th>{p.t('finance.accounts.type')}</th>
                <th>{p.t('finance.accounts.balance')}</th>
                <th>{p.t('finance.accounts.status')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagination.rows.map((row) => (
                <tr key={row.id}>
                  <FinanceSelectCell
                    checked={p.selection.selectedIds.has(row.id)}
                    onChange={() => p.selection.toggleSelect(row.id)}
                  />
                  <td>{row.name}</td>
                  <td><span className="finance-account-type">{row.type}</span></td>
                  <td className="finance-table__balance">{formatMoney(row.balance, row.currency)}</td>
                  <td>
                    <span className={`finance-badge ${row.active ? 'finance-badge--success' : 'finance-badge--muted'}`}>
                      {row.active ? p.t('common.active') : p.t('common.inactive')}
                    </span>
                  </td>
                  <td className="finance-cell-actions">
                    <FinanceRowActions
                      t={p.t}
                      onEdit={() => p.openEdit(row)}
                      onToggle={() => p.toggleActive(row)}
                      isActive={row.active !== false}
                      canDelete={false}
                      canToggle
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </BaseTable>
      </div>

      <BaseModal open={p.modalOpen} onClose={() => p.setModalOpen(false)} title={p.t('finance.accounts.add')} size="lg" className="finance-modal" bodyClassName="finance-modal__body">
        <div className="finance-form">
          <BaseInput label={p.t('finance.accounts.name')} value={p.form.name} onChange={(e) => p.setForm({ ...p.form, name: e.target.value })} />
          <BaseSelect label={p.t('finance.accounts.type')} value={p.form.type} onChange={(e) => p.setForm({ ...p.form, type: e.target.value })} options={p.accountTypes.map((type) => ({ value: type, label: type }))} />
          <BaseInput label={p.t('finance.accounts.initialBalance')} type="number" value={p.form.initialBalance} onChange={(e) => p.setForm({ ...p.form, initialBalance: e.target.value })} />
          <div className="finance-form__actions">
            <BaseButton variant="secondary" onClick={() => p.setModalOpen(false)}>{p.t('common.cancel')}</BaseButton>
            <BaseButton onClick={p.submit} disabled={!p.form.name.trim() || p.createMutation.isPending}>{p.t('common.save')}</BaseButton>
          </div>
        </div>
      </BaseModal>

      <BaseModal open={!!p.editModal} onClose={() => p.setEditModal(null)} title={p.t('finance.accounts.edit')} size="lg" className="finance-modal" bodyClassName="finance-modal__body">
        <div className="finance-form">
          <BaseInput label={p.t('finance.accounts.name')} value={p.editForm.name} onChange={(e) => p.setEditForm({ ...p.editForm, name: e.target.value })} />
          <BaseSelect label={p.t('finance.accounts.type')} value={p.editForm.type} onChange={(e) => p.setEditForm({ ...p.editForm, type: e.target.value })} options={p.accountTypes.map((type) => ({ value: type, label: type }))} />
          <label className="finance-form__label finance-form__label--checkbox">
            <input type="checkbox" checked={p.editForm.active} onChange={(e) => p.setEditForm({ ...p.editForm, active: e.target.checked })} />
            {p.t('common.active')}
          </label>
          <div className="finance-form__actions">
            <BaseButton variant="secondary" onClick={() => p.setEditModal(null)}>{p.t('common.cancel')}</BaseButton>
            <BaseButton onClick={p.submitEdit} disabled={!p.editForm.name.trim() || p.updateMutation.isPending}>{p.t('common.save')}</BaseButton>
          </div>
        </div>
      </BaseModal>

      <FinanceBulkConfirmModal
        open={p.bulkDisableOpen}
        onClose={() => p.setBulkDisableOpen(false)}
        title={p.t('finance.bulk.deactivateTitle')}
        hint={p.t('finance.bulk.deactivateHint', { count: p.selectedActive.length })}
        note={p.t('finance.accounts.deactivateNote')}
        confirmLabel={p.t('finance.bulk.deactivate')}
        cancelLabel={p.t('common.cancel')}
        onConfirm={p.confirmBulkDisable}
        isPending={p.bulkDisableMutation.isPending}
      />
    </PageLayout>
  );
}
