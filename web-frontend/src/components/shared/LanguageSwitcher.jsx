import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const LANGS = [
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
];

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();

  return (
    <div className={clsx(
      'flex items-center gap-1 rounded-lg border p-0.5',
      'border-slate-300 bg-slate-100/90 dark:border-slate-700 dark:bg-slate-800/80',
      className
    )}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => i18n.changeLanguage(code)}
          className={clsx(
            'px-2.5 py-1 rounded-md text-xs font-semibold transition',
            i18n.language?.startsWith(code)
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/80 dark:hover:text-white'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
