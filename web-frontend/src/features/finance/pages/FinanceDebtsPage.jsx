import TablePagination from '../../../components/shared/TablePagination';
import { BaseButton, BaseInput, BaseModal, BaseSelect, BaseTable, ErrorBanner, PageLayout } from '../../../components/ui';
import FinanceDebtEntriesModal from '../components/FinanceDebtEntriesModal';
import { useClientTablePagination } from '../hooks/useClientTablePagination';
import { useFinanceDebtsPage } from '../hooks/useFinanceDebtsPage';
import { formatMoney } from '../utils/formatMoney';
import '../../../styles/finance/common.css';
import '../../../styles/finance/forms.css';
import '../../../styles/finance/debts.css';

export default function FinanceDebtsPage() {
  const p = useFinanceDebtsPage();
  const allRows = p.tab === 'customers'
    ? (p.customerDebtsQuery.data ?? [])
    : p.tab === 'advances'
      ? (p.customerAdvancesQuery.data ?? [])
      : (p.supplierDebtsQuery.data ?? []);
  const isLoading = p.tab === 'customers'
    ? p.customerDebtsQuery.isLoading
    : p.tab === 'advances'
      ? p.customerAdvancesQuery.isLoading
      : p.supplierDebtsQuery.isLoading;
  const isError = p.customerDebtsQuery.isError
    || p.supplierDebtsQuery.isError
    || p.customerAdvancesQuery.isError
    || p.accountsQuery.isError;
  const pagination = useClientTablePagination(allRows, { initialPageSize: 14, resetKey: p.tab });

  return (
    <PageLayout title={p.t('finance.debts.title')} subtitle={p.t('finance.debts.subtitle')}>
      <div className="finance-page">
        <div className="finance-tabs">
          <button
            type="button"
            className={`finance-tabs__btn ${p.tab === 'customers' ? 'finance-tabs__btn--active' : ''}`}
            onClick={() => p.setTab('customers')}
          >
            {p.t('finance.debts.customers')}
          </button>
          <button
            type="button"
            className={`finance-tabs__btn ${p.tab === 'advances' ? 'finance-tabs__btn--active' : ''}`}
            onClick={() => p.setTab('advances')}
          >
            {p.t('finance.debts.advances')}
          </button>
          <button
            type="button"
            className={`finance-tabs__btn ${p.tab === 'suppliers' ? 'finance-tabs__btn--active' : ''}`}
            onClick={() => p.setTab('suppliers')}
          >
            {p.t('finance.debts.suppliers')}
          </button>
        </div>

        {isError ? <ErrorBanner message={p.t('common.loadError')} /> : null}

        <BaseTable
          className="finance-panel"
          isLoading={isLoading}
          isEmpty={!isLoading && allRows.length === 0}
          emptyMessage={p.tab === 'advances' ? p.t('finance.debts.advancesEmpty') : p.t('finance.debts.empty')}
          colSpan={3}
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
                <th>{p.t('finance.debts.name')}</th>
                <th>{p.tab === 'advances' ? p.t('finance.debts.advanceBalance') : p.t('finance.debts.balance')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pagination.rows.map((row) => (
                <tr key={row.counterpartyId}>
                  <td className="finance-debts__name">{row.counterpartyName || '—'}</td>
                  <td className={p.tab === 'advances' ? 'finance-amount--income' : 'finance-amount--expense'}>
                    {formatMoney(row.balance)}
                  </td>
                  <td className="finance-debts__actions">
                    <BaseButton size="sm" variant="secondary" onClick={() => p.openHistory(row)}>
                      {p.t('finance.debts.viewHistory')}
                    </BaseButton>
                    <BaseButton size="sm" onClick={() => p.openPay({
                      type: p.tab === 'customers' ? 'customer' : p.tab === 'advances' ? 'advance' : 'supplier',
                      counterpartyId: row.counterpartyId,
                      counterpartyName: row.counterpartyName,
                      balance: row.balance,
                    })}
                    >
                      {p.tab === 'advances' ? p.t('finance.debts.applyAdvance') : p.t('finance.debts.pay')}
                    </BaseButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </BaseTable>
      </div>

      <BaseModal
        open={!!p.payModal}
        onClose={() => p.setPayModal(null)}
        title={
          p.payModal?.type === 'advance'
            ? p.t('finance.debts.applyAdvanceTitle', { name: p.payModal?.counterpartyName ?? '' })
            : p.t('finance.debts.payTitle', { name: p.payModal?.counterpartyName ?? '' })
        }
        size="lg"
        className="finance-modal finance-modal--wide"
        bodyClassName="finance-modal__body"
      >
        <div className="finance-form">
          <BaseInput
            label={p.t('finance.common.amount')}
            type="number"
            value={p.payModal?.type === 'advance' ? p.applyForm.amount : p.form.amount}
            onChange={(e) => (
              p.payModal?.type === 'advance'
                ? p.setApplyForm({ ...p.applyForm, amount: e.target.value })
                : p.setForm({ ...p.form, amount: e.target.value })
            )}
          />
          {p.payModal?.type !== 'advance' ? (
            <>
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
                label={p.t('finance.common.paymentMethod')}
                value={p.form.paymentMethod}
                onChange={(e) => p.setForm({ ...p.form, paymentMethod: e.target.value })}
                options={[
                  { value: 'CASH', label: p.t('finance.payment.cash') },
                  { value: 'CARD', label: p.t('finance.payment.card') },
                  { value: 'BANK', label: p.t('finance.payment.bank') },
                ]}
              />
            </>
          ) : null}
          <BaseInput
            label={p.t('finance.common.comment')}
            value={p.payModal?.type === 'advance' ? p.applyForm.comment : p.form.comment}
            onChange={(e) => (
              p.payModal?.type === 'advance'
                ? p.setApplyForm({ ...p.applyForm, comment: e.target.value })
                : p.setForm({ ...p.form, comment: e.target.value })
            )}
          />
          <div className="finance-form__actions">
            <BaseButton variant="secondary" onClick={() => p.setPayModal(null)}>{p.t('common.cancel')}</BaseButton>
            <BaseButton
              onClick={p.submitPay}
              disabled={
                p.payPending
                || (p.payModal?.type === 'advance'
                  ? !p.applyForm.amount
                  : !p.form.amount || !p.form.accountId)
              }
            >
              {p.payModal?.type === 'advance'
                ? p.t('finance.debts.confirmApplyAdvance')
                : p.t('finance.debts.confirmPay')}
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      <FinanceDebtEntriesModal
        open={!!p.historyModal}
        onClose={() => p.setHistoryModal(null)}
        type={p.historyModal?.type}
        counterpartyId={p.historyModal?.counterpartyId}
        counterpartyName={p.historyModal?.counterpartyName}
        t={p.t}
      />
    </PageLayout>
  );
}
