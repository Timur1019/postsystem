// src/pages/CashRegistersStubPage.jsx
import { useTranslation } from 'react-i18next';

export default function CashRegistersStubPage({ titleKey }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{t(titleKey)}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('cashRegisters.comingSoon')}</p>
    </div>
  );
}
