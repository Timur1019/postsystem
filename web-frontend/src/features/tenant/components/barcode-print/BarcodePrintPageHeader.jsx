export default function BarcodePrintPageHeader({ t }) {
  return (
    <header className="barcode-print-page__header">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t('usersBarcodePrint.title')}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('usersBarcodePrint.intro')}</p>
    </header>
  );
}
