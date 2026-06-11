import { useQuery } from '@tanstack/react-query';
import { BaseModal, BaseTable } from '../../../components/ui';
import { financeApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { formatMoney } from '../utils/formatMoney';

export default function FinanceDebtEntriesModal({ open, onClose, type, counterpartyId, counterpartyName, t }) {
  const { tenantKey, tenantReady } = useTenantScope();

  const query = useQuery({
    queryKey: tenantKey('finance-debt-entries', type, counterpartyId),
    queryFn: () => {
      if (type === 'advance') {
        return financeApi.debts.advances.entries(counterpartyId).then((r) => r.data);
      }
      if (type === 'customer') {
        return financeApi.debts.customers.entries(counterpartyId).then((r) => r.data);
      }
      return financeApi.debts.suppliers.entries(counterpartyId).then((r) => r.data);
    },
    enabled: tenantReady && open && Boolean(counterpartyId),
  });

  const rows = query.data ?? [];

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={t('finance.debts.historyTitle', { name: counterpartyName ?? '' })}
      size="lg"
      className="finance-modal finance-modal--wide"
      bodyClassName="finance-modal__body"
    >
      <BaseTable
        isLoading={query.isLoading}
        isEmpty={!query.isLoading && rows.length === 0}
        emptyMessage={t('finance.debts.historyEmpty')}
        colSpan={4}
      >
        <table className="finance-table">
          <thead>
            <tr>
              <th>{t('finance.common.date')}</th>
              <th>{t('finance.debts.historyType')}</th>
              <th>{t('finance.common.amount')}</th>
              <th>{t('finance.common.comment')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.transactionDate}</td>
                <td>{row.entryType}</td>
                <td className="finance-amount--expense">{formatMoney(row.amount)}</td>
                <td>{row.comment || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </BaseTable>
    </BaseModal>
  );
}
