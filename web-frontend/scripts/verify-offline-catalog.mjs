#!/usr/bin/env node
/**
 * Проверка логики офлайн-каталога (без Electron UI).
 * node scripts/verify-offline-catalog.mjs
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

function productsEnabled({ storeId, searchActive, catalogBrowse }) {
  return Boolean(storeId && (searchActive || catalogBrowse === 'products'));
}

function hasLocalPosCatalog({ bootstrapReady, canSellOffline, productCount }) {
  return Boolean(bootstrapReady || canSellOffline || productCount > 0);
}

function shouldUseLocalPosCatalog({
  isDesktop,
  offlineLike,
  offlineAllowed,
  bootstrapReady,
  canSellOffline,
  productCount,
}) {
  if (!isDesktop || !offlineAllowed) return false;
  if (hasLocalPosCatalog({ bootstrapReady, canSellOffline, productCount })) return true;
  return offlineLike;
}

function resolvePosCatalogSource(ctx) {
  return shouldUseLocalPosCatalog(ctx) ? 'offline' : 'online';
}

console.log('Aurent — verify offline catalog logic\n');

test('товары грузятся на экране кассы без переключения на catalog pane', () => {
  if (!productsEnabled({ storeId: 1, searchActive: false, catalogBrowse: 'products' })) {
    throw new Error('products must load on register pane');
  }
  if (productsEnabled({ storeId: 1, searchActive: false, catalogBrowse: 'categories' })) {
    throw new Error('products must not load on categories browse');
  }
});

test('офлайн + desktop → локальный каталог даже без bootstrapReady в store', () => {
  if (
    !shouldUseLocalPosCatalog({
      isDesktop: true,
      offlineLike: true,
      offlineAllowed: true,
      bootstrapReady: false,
      canSellOffline: false,
      productCount: 0,
    })
  ) {
    throw new Error('expected local catalog when offline');
  }
});

test('онлайн без локального каталога → онлайн', () => {
  if (
    shouldUseLocalPosCatalog({
      isDesktop: true,
      offlineLike: false,
      offlineAllowed: true,
      bootstrapReady: false,
      canSellOffline: false,
      productCount: 0,
    })
  ) {
    throw new Error('must use online catalog when online and no local data');
  }
});

test('productCount > 0 → всегда локальный каталог (даже если probe онлайн)', () => {
  if (
    resolvePosCatalogSource({
      isDesktop: true,
      offlineLike: false,
      offlineAllowed: true,
      bootstrapReady: false,
      canSellOffline: false,
      productCount: 12,
    }) !== 'offline'
  ) {
    throw new Error('expected local catalog when productCount > 0');
  }
});

test('bootstrap готов → всегда локальный каталог на desktop', () => {
  if (
    !shouldUseLocalPosCatalog({
      isDesktop: true,
      offlineLike: false,
      offlineAllowed: true,
      bootstrapReady: true,
      canSellOffline: false,
      productCount: 0,
    })
  ) {
    throw new Error('expected local catalog when bootstrap ready');
  }
});

test('нет offline-доступа → онлайн даже при обрыве', () => {
  if (
    shouldUseLocalPosCatalog({
      isDesktop: true,
      offlineLike: true,
      offlineAllowed: false,
      bootstrapReady: true,
      canSellOffline: true,
      productCount: 10,
    })
  ) {
    throw new Error('must not use local without offline permission');
  }
});

console.log(`\nИтого: ${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
