import { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { downloadSpreadsheet } from '../../utils/downloadSpreadsheet';

export default function ReportExportButton({ fetchBlob, filenamePrefix, disabled = false }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const res = await fetchBlob();
      downloadSpreadsheet(res.data, filenamePrefix);
      toast.success(t('stockReports.exportDone'));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('stockReports.exportFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || busy}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Download size={16} />
      {busy ? t('stockReports.exporting') : t('stockReports.export')}
    </button>
  );
}
