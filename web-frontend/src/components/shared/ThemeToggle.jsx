// src/components/shared/ThemeToggle.jsx
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';

export default function ThemeToggle({ className = '' }) {
  const { t } = useTranslation();
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggleMode);
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? t('theme.switchToDay') : t('theme.switchToNight')}
      aria-label={isDark ? t('theme.switchToDay') : t('theme.switchToNight')}
      className={`flex items-center justify-center rounded-lg border p-2 transition
        border-slate-300 bg-white text-amber-600 shadow-sm hover:bg-slate-50
        dark:border-slate-600 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700
        ${className}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
