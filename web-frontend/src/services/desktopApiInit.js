import { api } from './api';
import { isDesktopCashier } from '../utils/authLogin';

let configured = false;

/** Desktop: API напрямую на backendOrigin (обходит сломанный прокси на Windows). */
export async function configureDesktopApiBaseUrl() {
  if (configured) return api.defaults.baseURL;
  if (!isDesktopCashier() || typeof window.desktopCashier?.getApiBaseUrl !== 'function') {
    configured = true;
    return api.defaults.baseURL;
  }
  try {
    const baseUrl = await window.desktopCashier.getApiBaseUrl();
    if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
      api.defaults.baseURL = String(baseUrl).replace(/\/$/, '');
    }
    api.defaults.timeout = 6_000;
  } catch {
    // relative /api/v1 — fallback через локальный прокси
  }
  configured = true;
  return api.defaults.baseURL;
}

export function resetDesktopApiBaseUrl() {
  configured = false;
}
