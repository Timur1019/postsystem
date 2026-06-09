import { format } from 'date-fns';

export const CASHIER_SIDEBAR_KEY = 'cashier-sidebar-open';

export function displayCashierName(user) {
  if (!user) return '';
  const parts = [user.lastName, user.firstName, user.patronymic].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return user.username ?? '';
}

export function formatShiftOpenedAt(openedAt) {
  if (openedAt == null) return null;
  try {
    return format(new Date(openedAt), 'dd.MM.yyyy HH:mm');
  } catch {
    return null;
  }
}

export function readSidebarOpen() {
  try {
    const v = localStorage.getItem(CASHIER_SIDEBAR_KEY);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    /* ignore */
  }
  return true;
}
