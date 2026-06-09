import { useTranslation } from 'react-i18next';
import WriteOffsReportHeader from '../components/write-offs/WriteOffsReportHeader';
import WriteOffsReportFilters from '../components/write-offs/WriteOffsReportFilters';
import WriteOffsReportTable from '../components/write-offs/WriteOffsReportTable';
import WriteOffsReportModals from '../components/write-offs/WriteOffsReportModals';
import { useWriteOffsReportPage } from '../hooks/useWriteOffsReportPage';

export default function WriteOffsReportPage() {
  const { t } = useTranslation();
  const r = useWriteOffsReportPage();

  return (
    <div className="space-y-6">
      <WriteOffsReportHeader t={t} onNewWriteOff={r.openWriteOff} />

      <WriteOffsReportFilters
        from={r.from}
        to={r.to}
        onFrom={r.setFrom}
        onTo={r.setTo}
        stores={r.stores}
        storeId={r.storeId}
        onStoreChange={r.handleStoreChange}
      />

      <WriteOffsReportTable
        t={t}
        rows={r.rows}
        isPending={r.isPending}
        page={r.page}
        pageSize={r.pageSize}
        total={r.total}
        totalPages={r.totalPages}
        onPageChange={r.setPage}
        onPageSizeChange={r.setPageSize}
      />

      <WriteOffsReportModals
        writeOffOpen={r.writeOffOpen}
        pickProduct={r.pickProduct}
        productSearch={r.productSearch}
        onSearchChange={r.setProductSearch}
        productCandidates={r.productCandidates}
        onSelectProduct={r.selectProduct}
        onClose={r.closeWriteOff}
        storeId={r.numericStoreId}
        onSaved={() => r.refetch()}
      />
    </div>
  );
}
