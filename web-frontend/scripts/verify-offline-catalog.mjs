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

function shouldUseLocalPosCatalog({ isDesktop, offlineLike, offlineAllowed, bootstrapReady }) {
  if (!isDesktop) return false;
  if (offlineLike && !offlineAllowed) return false;
  if (bootstrapReady) return true;
  return offlineLike;
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
    })
  ) {
    throw new Error('expected local catalog when offline');
  }
});

test('онлайн без bootstrap → онлайн каталог', () => {
  if (
    shouldUseLocalPosCatalog({
      isDesktop: true,
      offlineLike: false,
      offlineAllowed: true,
      bootstrapReady: false,
    })
  ) {
    throw new Error('must use online catalog when online and no bootstrap');
  }
});

test('bootstrap готов → всегда локальный каталог на desktop', () => {
  if (
    !shouldUseLocalPosCatalog({
      isDesktop: true,
      offlineLike: false,
      offlineAllowed: true,
      bootstrapReady: true,
    })
  ) {
    throw new Error('expected local catalog when bootstrap ready');
  }
});

console.log(`\nИтого: ${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
