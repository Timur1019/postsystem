import { createPortal } from 'react-dom';
import ZReportFiltersDrawer from './ZReportFiltersDrawer';
import ZReportAutoPrint from './ZReportAutoPrint';
import ZReportsRowMenu from './ZReportsRowMenu';

export default function ZReportsOverlays({
  t,
  filtersOpen,
  onFiltersClose,
  filters,
  onFiltersChange,
  stores,
  onFiltersReset,
  onFiltersApply,
  rowMenu,
  onRowMenuClose,
  onExportRowSales,
  onStartPrint,
  printZId,
  onClosePrint,
}) {
  return (
    <>
      <ZReportFiltersDrawer
        open={filtersOpen}
        onClose={onFiltersClose}
        filters={filters}
        onChange={onFiltersChange}
        stores={stores}
        onReset={onFiltersReset}
        onApply={onFiltersApply}
      />

      <ZReportsRowMenu
        t={t}
        menu={rowMenu}
        onClose={onRowMenuClose}
        onExportSales={() => {
          onExportRowSales(rowMenu.row.id);
          onRowMenuClose();
        }}
        onPrint={() => onStartPrint(rowMenu.row.id)}
      />

      {printZId
        ? createPortal(<ZReportAutoPrint zReportId={printZId} onClose={onClosePrint} />, document.body)
        : null}
    </>
  );
}
