/** Сетевой сбой axios (нет ответа сервера), не бизнес-ошибка 4xx/5xx. */
export function isApiNetworkError(error) {
  if (!error) return false;
  const code = error.code;
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
  return !error.response && Boolean(error.request);
}
