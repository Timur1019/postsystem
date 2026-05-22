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
