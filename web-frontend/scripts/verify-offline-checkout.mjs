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

function shouldPreferLocalCheckout({ isDesktop, canSellOffline, offlineLike, offlineAllowed }) {
  if (!isDesktop || !offlineAllowed) return false;
  if (canSellOffline) return true;
  return Boolean(offlineLike);
}

function canFallbackToOfflineCheckout({ isDesktop, canSellOffline, offlineLike, offlineAllowed }) {
  if (!offlineAllowed) return false;
  if (canSellOffline) return true;
  return Boolean(isDesktop && offlineLike);
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

test('desktop + каталог → сначала локальный чекаут (даже если probe онлайн)', () => {
  if (
    !shouldPreferLocalCheckout({
      isDesktop: true,
      canSellOffline: true,
      offlineLike: false,
      offlineAllowed: true,
    })
  ) {
    throw new Error('expected local-first');
  }
});

test('онлайн без каталога → не форсировать локальный чекаут', () => {
  if (
    shouldPreferLocalCheckout({
      isDesktop: true,
      canSellOffline: false,
      offlineLike: false,
      offlineAllowed: true,
    })
  ) {
    throw new Error('must not force local when online without catalog');
  }
});

test('офлайн без canSellOffline в store → всё равно локальный чекаут', () => {
  if (
    !shouldPreferLocalCheckout({
      isDesktop: true,
      canSellOffline: false,
      offlineLike: true,
      offlineAllowed: true,
    })
  ) {
    throw new Error('expected local checkout when offline');
  }
  if (
    !canFallbackToOfflineCheckout({
      isDesktop: true,
      canSellOffline: false,
      offlineLike: true,
      offlineAllowed: true,
    })
  ) {
    throw new Error('expected offline fallback when offline');
  }
});

console.log(`\nИтого: ${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
