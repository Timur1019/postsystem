export const PIN_LOGIN_HERO_URL = '/cashier/pin-login-hero.jpg';

export const PIN_MIN = 4;

export const PIN_MAX = 6;

export function normalizePin(value) {
  return String(value || '').replace(/\D/g, '').slice(0, PIN_MAX);
}
