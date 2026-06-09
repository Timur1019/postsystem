/**
 * Сообщение об ошибке из ответа API (единый формат ApiErrorResponse).
 */
export function getApiErrorMessage(error, fallback = '') {
  const data = error?.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

/** Код ошибки: BAD_REQUEST, NOT_FOUND, CONFLICT, INTERNAL_ERROR, … */
export function getApiErrorCode(error) {
  return error?.response?.data?.code ?? null;
}

/** Контекст (только если backend включил app.errors.include-context) */
export function getApiErrorContext(error) {
  const ctx = error?.response?.data?.context;
  return ctx && typeof ctx === 'object' ? ctx : null;
}

const GENERIC_SERVER_ERROR = 'An unexpected error occurred';

/** Сообщение для экранов входа (касса / админка) — без сырого английского INTERNAL_ERROR. */
export function resolveAuthErrorMessage(error, t) {
  if (!error?.response) {
    return t('login.networkError');
  }
  const status = error.response.status;
  const apiMsg = getApiErrorMessage(error, '');
  if (status === 502 || status === 503 || status === 504) {
    return t('login.serviceUnavailable');
  }
  if (apiMsg === GENERIC_SERVER_ERROR || error.response?.data?.code === 'INTERNAL_ERROR') {
    return t('login.serverError');
  }
  if (apiMsg === 'Invalid PIN') {
    return t('login.badPin', { defaultValue: 'Неверный PIN' });
  }
  if (apiMsg === 'Invalid company code') {
    return t('login.badCompanyCode');
  }
  if (apiMsg) {
    return apiMsg;
  }
  return t('login.failed');
}

/** Для dev: полная строка code + message + context */
export function formatApiErrorForLog(error) {
  const code = getApiErrorCode(error);
  const msg = getApiErrorMessage(error, '');
  const ctx = getApiErrorContext(error);
  const parts = [code, msg].filter(Boolean);
  if (ctx && Object.keys(ctx).length > 0) {
    parts.push(JSON.stringify(ctx));
  }
  return parts.join(' | ') || String(error);
}
