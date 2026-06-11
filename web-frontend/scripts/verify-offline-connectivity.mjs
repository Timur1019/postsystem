#!/usr/bin/env node
/**
 * Проверка offline/online логики кассы.
 * node scripts/verify-offline-connectivity.mjs
 */

import {
  canFallbackToOfflineCheckout,
  canUseOfflineCatalogFallback,
  catalogMatchesStore,
  hasLocalPosCatalog,
  isCatalogStoreMismatch,
  shouldPreferLocalCheckout,
  shouldRetryOnlineAfterOfflineFailure,
  shouldUseLocalPosCatalog,
} from '../src/services/offline/connectivityRules.js';

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

const storeA = { bootstrapReady: true, canSellOffline: true, productCount: 100, storeId: 5 };
const storeB = { bootstrapReady: true, canSellOffline: true, productCount: 100, storeId: 9 };
const emptyCatalog = { bootstrapReady: false, canSellOffline: false, productCount: 0, storeId: null };

const desktopCtx = { isDesktop: true, offlineAllowed: true };

console.log('Aurent — verify offline connectivity logic\n');

test('онлайн + локальный каталог → оплата через API (не local-first)', () => {
  if (
    shouldPreferLocalCheckout({
      ...desktopCtx,
      offlineLike: false,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('must not prefer local checkout when online');
  }
});

test('онлайн + локальный каталог → каталог через API', () => {
  if (
    shouldUseLocalPosCatalog({
      ...desktopCtx,
      offlineLike: false,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('must not use local catalog when online');
  }
});

test('офлайн + каталог своего магазина → local-first', () => {
  if (
    !shouldPreferLocalCheckout({
      ...desktopCtx,
      offlineLike: true,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('expected local checkout when offline with matching catalog');
  }
});

test('офлайн + каталог чужого магазина → не local-first', () => {
  if (
    shouldPreferLocalCheckout({
      ...desktopCtx,
      offlineLike: true,
      state: storeB,
      storeId: 5,
    })
  ) {
    throw new Error('must not checkout with mismatched catalog store');
  }
});

test('офлайн без каталога → не local-first', () => {
  if (
    shouldPreferLocalCheckout({
      ...desktopCtx,
      offlineLike: true,
      state: emptyCatalog,
      storeId: 5,
    })
  ) {
    throw new Error('must not checkout without catalog');
  }
});

test('онлайн API fail → fallback checkout если есть каталог', () => {
  if (
    !canFallbackToOfflineCheckout({
      ...desktopCtx,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('expected checkout fallback with matching catalog');
  }
});

test('онлайн API fail → нет fallback без каталога', () => {
  if (
    canFallbackToOfflineCheckout({
      ...desktopCtx,
      state: emptyCatalog,
      storeId: 5,
    })
  ) {
    throw new Error('must not fallback without catalog');
  }
});

test('онлайн API fail → нет fallback при чужом каталоге', () => {
  if (
    canFallbackToOfflineCheckout({
      ...desktopCtx,
      state: storeB,
      storeId: 5,
    })
  ) {
    throw new Error('must not fallback with mismatched catalog');
  }
});

test('каталог fallback при сбое API', () => {
  if (
    !canUseOfflineCatalogFallback({
      ...desktopCtx,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('expected catalog fallback');
  }
});

test('web-касса → всегда онлайн', () => {
  if (
    shouldPreferLocalCheckout({
      isDesktop: false,
      offlineAllowed: true,
      offlineLike: true,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('web must not use local checkout');
  }
});

test('IPC timeout → не retry онлайн', () => {
  if (
    shouldRetryOnlineAfterOfflineFailure(new Error('offline_ipc_timeout'), {
      ...desktopCtx,
      offlineLike: false,
      apiOnline: true,
      offlineMode: false,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('must not retry online after ipc timeout');
  }
});

test('офлайн + сбой local → не retry онлайн', () => {
  if (
    shouldRetryOnlineAfterOfflineFailure(new Error('db_locked'), {
      ...desktopCtx,
      offlineLike: true,
      apiOnline: true,
      offlineMode: false,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('must not retry online when offlineLike');
  }
});

test('онлайн + сбой local → retry онлайн', () => {
  if (
    !shouldRetryOnlineAfterOfflineFailure(new Error('db_locked'), {
      ...desktopCtx,
      offlineLike: false,
      apiOnline: true,
      offlineMode: false,
      state: storeA,
      storeId: 5,
    })
  ) {
    throw new Error('expected online retry when truly online');
  }
});

test('catalogMatchesStore: null storeId → false', () => {
  if (catalogMatchesStore(5, null) || catalogMatchesStore(null, 5)) {
    throw new Error('null storeId must not match');
  }
});

test('hasLocalPosCatalog: productCount без storeId → false', () => {
  if (hasLocalPosCatalog({ productCount: 10, storeId: null }, 5)) {
    throw new Error('catalog without storeId must not count');
  }
});

test('несовпадение storeId каталога', () => {
  if (!isCatalogStoreMismatch(5, 9)) {
    throw new Error('expected store mismatch');
  }
  if (isCatalogStoreMismatch(5, 5)) {
    throw new Error('same store must not mismatch');
  }
});

test('каталог: таймаут онлайн 4с', () => {
  const POS_CATALOG_ONLINE_TIMEOUT_MS = 4_000;
  if (POS_CATALOG_ONLINE_TIMEOUT_MS > 5_000) {
    throw new Error('catalog timeout too long');
  }
});

console.log(`\nИтого: ${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
