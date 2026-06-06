export default function ProductImportModalFooter({
  step,
  setStep,
  onClose,
  pickFile,
  runImport,
  canImport,
  allDuplicates,
  importing,
  t,
}) {
  return (
    <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
      {step === 'preview' && (
        <button
          type="button"
          onClick={() => setStep('setup')}
          className="mr-auto rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('products.import.back')}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {t('products.import.close')}
      </button>
      {step === 'setup' ? (
        <button
          type="button"
          onClick={pickFile}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          {t('products.import.pickFile')}
        </button>
      ) : (
        <button
          type="button"
          onClick={runImport}
          disabled={!canImport || importing || allDuplicates}
          title={allDuplicates ? t('products.import.invoiceAllDuplicates') : undefined}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {importing ? '…' : t('products.import.confirmImport')}
        </button>
      )}
    </div>
  );
}
