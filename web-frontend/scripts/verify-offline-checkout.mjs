#!/usr/bin/env node
/**
 * Проверка логики офлайн-чекаута (без Electron UI).
 * node scripts/verify-offline-checkout.mjs
 */

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

function isApiNetworkError(error) {
  if (!error) return false;
  const code = error.code;
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
  return !error.response && Boolean(error.request);
}

function isApiUnreachableError(error, isDesktop) {
  if (isApiNetworkError(error)) return true;
  if (!isDesktop) return false;
  const status = error?.response?.status;
  return status === 502 || status === 503 || status === 504;
}

function shouldRunOfflineCheckoutFirst({ isDesktop, canSellOffline, offlineLike }) {
  return Boolean(isDesktop && canSellOffline && offlineLike);
}

console.log('Aurent — verify offline checkout logic\n');

test('502 от embedded-прокси → fallback на офлайн (desktop)', () => {
  const err = { response: { status: 502 }, request: {} };
  if (!isApiUnreachableError(err, true)) throw new Error('expected unreachable');
});

test('таймаут axios → fallback на офлайн', () => {
  const err = { code: 'ECONNABORTED', request: {} };
  if (!isApiUnreachableError(err, true)) throw new Error('expected unreachable');
});

test('400 бизнес-ошибка → не fallback', () => {
  const err = { response: { status: 400 }, request: {} };
  if (isApiUnreachableError(err, true)) throw new Error('must not fallback on 400');
});

test('desktop offline + catalog → сразу локальный чекаут', () => {
  if (!shouldRunOfflineCheckoutFirst({ isDesktop: true, canSellOffline: true, offlineLike: true })) {
    throw new Error('expected offline-first');
  }
});

test('desktop online → не форсировать офлайн', () => {
  if (shouldRunOfflineCheckoutFirst({ isDesktop: true, canSellOffline: true, offlineLike: false })) {
    throw new Error('must not force offline when online');
  }
});

test('нет каталога → не форсировать офлайн', () => {
  if (shouldRunOfflineCheckoutFirst({ isDesktop: true, canSellOffline: false, offlineLike: true })) {
    throw new Error('must not force offline without catalog');
  }
});

console.log(`\nИтого: ${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
