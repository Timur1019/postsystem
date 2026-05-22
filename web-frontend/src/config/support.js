/** Контакты службы поддержки (VITE_* задаются при сборке фронтенда). */

function normalizeBotUsername(raw) {
  const value = (raw ?? '').trim().replace(/^@/, '');
  return value || null;
}

/** Значения по умолчанию для npm run dev, если VITE_* не заданы */
const DEV_DEFAULT_PHONE = '+998 90 123 45 67';
const DEV_DEFAULT_TELEGRAM_BOT = 'pos_support_bot';

function envOrDevFallback(raw, devFallback) {
  const value = (raw ?? '').trim();
  if (value) return value;
  return import.meta.env.DEV ? devFallback : null;
}

export const supportPhone = envOrDevFallback(import.meta.env.VITE_SUPPORT_PHONE, DEV_DEFAULT_PHONE);

export const supportTelegramBot = normalizeBotUsername(
  envOrDevFallback(import.meta.env.VITE_SUPPORT_TELEGRAM_BOT, DEV_DEFAULT_TELEGRAM_BOT)
);

export function supportTelegramUrl() {
  if (!supportTelegramBot) return null;
  return `https://t.me/${supportTelegramBot}`;
}

export function supportPhoneHref() {
  if (!supportPhone) return null;
  const digits = supportPhone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

export function isSupportConfigured() {
  return Boolean(supportPhone || supportTelegramBot);
}
