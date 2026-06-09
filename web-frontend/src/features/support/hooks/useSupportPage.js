import {
  isSupportConfigured,
  supportPhone,
  supportPhoneHref,
  supportTelegramBot,
  supportTelegramUrl,
} from '../../../config/support';

export function useSupportPage() {
  const configured = isSupportConfigured();
  const telegramUrl = supportTelegramUrl();
  const phoneHref = supportPhoneHref();

  return {
    configured,
    supportPhone,
    phoneHref,
    supportTelegramBot,
    telegramUrl,
    hasPhone: Boolean(supportPhone),
    hasTelegram: Boolean(supportTelegramBot && telegramUrl),
  };
}
