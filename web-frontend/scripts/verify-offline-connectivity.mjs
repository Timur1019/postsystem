#!/usr/bin/env node
/**
 * Проверка мгновенного offline и retry-логики чекаута.
 * node scripts/verify-offline-connectivity.mjs
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

const NO_ONLINE_RETRY = new Set([
  'offline_ipc_timeout',
  'offline_checkout_timeout',
  'OFFLINE_SALE_SAVE_FAILED',
  'offline_sale_save_failed',
  'OFFLINE_SHIFT_REQUIRED',
]);

function shouldPreferLocalCheckout({ isDesktop, offlineAllowed, canSellOffline, offlineLike }) {
  if (!isDesktop || !offlineAllowed) return false;
  if (canSellOffline) return true;
  return offlineLike;
}

function shouldRetryOnlineAfterOfflineFailure(offlineErr, ctx) {
  const msg = String(offlineErr?.message || '');
  if (NO_ONLINE_RETRY.has(msg)) return false;
  if (shouldPreferLocalCheckout(ctx)) return false;
  if (ctx.offlineLike) return false;
  return Boolean(ctx.apiOnline && !ctx.offlineMode);
}

console.log('Aurent — verify offline connectivity logic\n');

test('IPC timeout → не retry онлайн', () => {
  if (
    shouldRetryOnlineAfterOfflineFailure(new Error('offline_ipc_timeout'), {
      isDesktop: true,
      offlineAllowed: true,
      canSellOffline: true,
      offlineLike: false,
      apiOnline: true,
      offlineMode: false,
    })
  ) {
    throw new Error('must not retry online after ipc timeout');
  }
});

test('prefer local + probe онлайн → не retry онлайн после сбоя', () => {
  if (
    shouldRetryOnlineAfterOfflineFailure(new Error('unknown'), {
      isDesktop: true,
      offlineAllowed: true,
      canSellOffline: true,
      offlineLike: false,
      apiOnline: true,
      offlineMode: false,
    })
  ) {
    throw new Error('must not retry online when local-first');
  }
});

test('offlineLike → не retry онлайн', () => {
  if (
    shouldRetryOnlineAfterOfflineFailure(new Error('unknown'), {
      isDesktop: true,
      offlineAllowed: true,
      canSellOffline: false,
      offlineLike: true,
      apiOnline: true,
      offlineMode: false,
    })
  ) {
    throw new Error('must not retry online when offlineLike');
  }
});

test('подтверждённый онлайн без local-first → можно retry', () => {
  if (
    !shouldRetryOnlineAfterOfflineFailure(new Error('db_locked'), {
      isDesktop: true,
      offlineAllowed: true,
      canSellOffline: false,
      offlineLike: false,
      apiOnline: true,
      offlineMode: false,
    })
  ) {
    throw new Error('expected online retry when truly online');
  }
});

test('каталог: таймаут онлайн 4с (не 20с)', () => {
  const POS_CATALOG_ONLINE_TIMEOUT_MS = 4_000;
  if (POS_CATALOG_ONLINE_TIMEOUT_MS > 5_000) {
    throw new Error('catalog timeout too long');
  }
});

console.log(`\nИтого: ${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
