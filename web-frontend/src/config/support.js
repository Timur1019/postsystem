/** Контакты службы поддержки (VITE_* задаются при сборке фронтенда). */

function normalizeBotUsername(raw) {
  const value = (raw ?? '').trim().replace(/^@/, '');
  return value || null;
}

export const supportPhone = (import.meta.env.VITE_SUPPORT_PHONE ?? '').trim() || null;

export const supportTelegramBot = normalizeBotUsername(import.meta.env.VITE_SUPPORT_TELEGRAM_BOT);

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
