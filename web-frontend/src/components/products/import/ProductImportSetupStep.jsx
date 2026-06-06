import toast from 'react-hot-toast';
import { productApi } from '../../../services/api';
import { optCls } from '../../../utils/productImportUtils';

export default function ProductImportSetupStep({ t, source, setSource, mode, setMode }) {
  return (
    <>
      <a
        href="#"
        className="float-right text-sm text-emerald-600 hover:underline dark:text-emerald-400"
        onClick={async (e) => {
          e.preventDefault();
          try {
            const res = await productApi.importTemplate();
            const blob = new Blob([res.data], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products_import_template.xlsx';
            a.click();
            URL.revokeObjectURL(url);
          } catch {
            toast.error(t('products.import.templateSoon'));
          }
        }}
      >
        {t('products.import.downloadTemplate')}
      </a>

      <p className="text-sm text-slate-600 dark:text-slate-300">{t('products.import.sourceLabel')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {['UZ_INVOICE', 'CATALOG'].map((key) => (
          <label key={key} className={optCls(source === key)}>
            <input
              type="radio"
              name="src"
              checked={source === key}
              onChange={() => setSource(key)}
              className="mt-1"
            />
            <span className="text-sm text-slate-800 dark:text-slate-200">
              {t(`products.import.source.${key}`)}
            </span>
          </label>
        ))}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">{t('products.import.question')}</p>
      <div className="space-y-2">
        {['AS_FILE', 'TO_STORES', 'TO_CATALOG'].map((key) => (
          <label key={key} className={optCls(mode === key)}>
            <input type="radio" name="im" checked={mode === key} onChange={() => setMode(key)} className="mt-1" />
            <span className="text-sm text-slate-800 dark:text-slate-200">{t(`products.import.mode.${key}`)}</span>
          </label>
        ))}
      </div>
    </>
  );
}
