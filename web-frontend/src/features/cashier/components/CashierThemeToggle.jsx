import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

/**
 * @param {{ theme: 'dark' | 'light'; onToggle: () => void; className?: string; compact?: boolean }} props
 */
export default function CashierThemeToggle({ theme, onToggle, className = '', compact = false }) {
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const label = isDark ? t('pos.themeLight') : t('pos.themeDark');

  return (
    <button
      type="button"
      className={clsx('cashier-theme-toggle', compact && 'cashier-theme-toggle--compact', className)}
      onClick={onToggle}
      aria-label={t('pos.themeToggle')}
      title={label}
    >
      {isDark ? <Sun size={compact ? 18 : 20} strokeWidth={2} aria-hidden /> : <Moon size={compact ? 18 : 20} strokeWidth={2} aria-hidden />}
      {!compact ? <span className="cashier-theme-toggle__label">{label}</span> : null}
    </button>
  );
}
