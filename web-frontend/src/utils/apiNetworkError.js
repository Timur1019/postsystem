import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';

/** Сетевой сбой axios (нет ответа сервера), не бизнес-ошибка 4xx/5xx. */
export function isApiNetworkError(error) {
  if (!error) return false;
  const code = error.code;
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
  return !error.response && Boolean(error.request);
}

/** Desktop: сеть/прокси недоступны — можно перейти на офлайн-продажу. */
export function isApiUnreachableError(error) {
  if (isApiNetworkError(error)) return true;
  if (!isDesktopOfflineBridge()) return false;
  const status = error?.response?.status;
  return status === 502 || status === 503 || status === 504;
}
