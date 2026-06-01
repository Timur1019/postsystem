/** Единые URL входа: касса = PIN, админка = /login?admin=1 */

export const CASHIER_LOGIN_PATH = '/cashier/login';
export const ADMIN_LOGIN_QUERY = 'admin=1';

export function isDesktopCashier() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);
}

export function isAuthPage(pathname = '') {
  const p = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  return p.startsWith(CASHIER_LOGIN_PATH) || p.startsWith('/login');
}

export function adminLoginPath() {
  return `/login?${ADMIN_LOGIN_QUERY}`;
}

export function cashierLoginPath() {
  if (typeof window === 'undefined') return CASHIER_LOGIN_PATH;
  try {
    const fromStorage = localStorage.getItem('pos.companyLoginCode');
    if (fromStorage) {
      return `${CASHIER_LOGIN_PATH}?${new URLSearchParams({ companyLoginCode: fromStorage })}`;
    }
  } catch {
    /* ignore */
  }
  return CASHIER_LOGIN_PATH;
}

/** Куда отправлять при logout / 401 в контексте кассы или десктопа. */
export function defaultLoginPath() {
  if (isDesktopCashier()) return cashierLoginPath();
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/cashier')) {
    return cashierLoginPath();
  }
  return adminLoginPath();
}

export function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const target = defaultLoginPath();
  if (window.location.pathname + window.location.search === target) return;
  window.location.href = target;
}
