export const CASHIER_THEME_STORAGE_KEY = 'pos-cashier-theme';

/** @typedef {'dark' | 'light'} CashierTheme */

/** @returns {CashierTheme} */
export function readCashierTheme() {
  try {
    const v = localStorage.getItem(CASHIER_THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* ignore */
  }
  return 'dark';
}

/** @param {CashierTheme} theme */
export function writeCashierTheme(theme) {
  try {
    localStorage.setItem(CASHIER_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** @param {CashierTheme} theme */
export function cashierThemeClassName(theme) {
  return theme === 'light' ? 'cashier-app--light' : 'cashier-app--terminal';
}

/** @param {CashierTheme} theme */
export function syncCashierThemeDocument(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('cashier-theme--light', 'cashier-theme--dark');
  root.classList.add(theme === 'light' ? 'cashier-theme--light' : 'cashier-theme--dark');
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
}
