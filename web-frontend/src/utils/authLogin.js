/** Единые URL входа: касса = PIN, админка = /login?admin=1 */

export const CASHIER_LOGIN_PATH = '/cashier/login';
export const ADMIN_LOGIN_QUERY = 'admin=1';
export const COMPANY_CODE_STORAGE_KEY = 'pos.companyLoginCode';

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

export function normalizeCompanyLoginCode(code) {
  const digits = String(code || '').trim().replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 10000 || n > 99999) return '';
  return String(n).padStart(5, '0');
}

export function persistCompanyLoginCode(code) {
  const normalized = normalizeCompanyLoginCode(code);
  try {
    if (normalized) {
      localStorage.setItem(COMPANY_CODE_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(COMPANY_CODE_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
  return normalized;
}

export async function resolveCashierCompanyCode(searchParams) {
  if (isDesktopCashier() && window.desktopCashier?.getCompanyLoginCode) {
    try {
      const fromDesktop = await window.desktopCashier.getCompanyLoginCode();
      const code = persistCompanyLoginCode(fromDesktop);
      if (code) return code;
    } catch {
      /* ignore */
    }
  }

  const fromUrl = searchParams?.get?.('companyLoginCode');
  if (fromUrl) {
    return persistCompanyLoginCode(fromUrl);
  }

  try {
    const stored = localStorage.getItem(COMPANY_CODE_STORAGE_KEY);
    if (stored) return normalizeCompanyLoginCode(stored);
  } catch {
    /* ignore */
  }
  return '';
}

export function cashierLoginPath() {
  if (isDesktopCashier()) return CASHIER_LOGIN_PATH;
  try {
    const fromStorage = localStorage.getItem(COMPANY_CODE_STORAGE_KEY);
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

export function cashierSessionMatchesCompany(user, companyCode) {
  if (!user || user.role !== 'CASHIER') return true;
  const expected = normalizeCompanyLoginCode(companyCode);
  if (!expected) return true;
  const sessionCode = normalizeCompanyLoginCode(user.companyLoginCode);
  if (!sessionCode) return false;
  return sessionCode === expected;
}
