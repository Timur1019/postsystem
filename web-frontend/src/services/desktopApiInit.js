import { api } from './api';
import { isDesktopCashier } from '../utils/authLogin';

let configured = false;

function isLocalEmbeddedUi() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === '127.0.0.1' || host === 'localhost';
}

/** Desktop: embedded UI → локальный прокси /api/v1; remote UI → прямой backendOrigin. */
export async function configureDesktopApiBaseUrl() {
  if (configured) return api.defaults.baseURL;
  if (!isDesktopCashier()) {
    configured = true;
    return api.defaults.baseURL;
  }

  if (isLocalEmbeddedUi()) {
    api.defaults.baseURL = '/api/v1';
    api.defaults.timeout = 20_000;
    configured = true;
    return api.defaults.baseURL;
  }

  try {
    const baseUrl = await window.desktopCashier.getApiBaseUrl();
    if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
      api.defaults.baseURL = String(baseUrl).replace(/\/$/, '');
    }
    api.defaults.timeout = 20_000;
  } catch {
    // relative /api/v1 — fallback через локальный прокси
  }
  configured = true;
  return api.defaults.baseURL;
}

export function resetDesktopApiBaseUrl() {
  configured = false;
}
