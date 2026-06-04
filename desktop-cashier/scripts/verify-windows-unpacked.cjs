#!/usr/bin/env node
/**
 * Проверка win-unpacked после electron-builder (CI / локально на Windows).
 * node scripts/verify-windows-unpacked.cjs [path-to-win-unpacked]
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const unpacked =
  process.argv[2] || path.join(root, 'release', 'win-unpacked');

function mustExist(rel) {
  const p = path.join(unpacked, rel);
  if (!fs.existsSync(p)) {
    throw new Error(`Нет файла: ${rel}`);
  }
  return p;
}

try {
  mustExist('Aurent Cashier.exe');
  const resources = mustExist('resources');
  const appAsar = path.join(resources, 'app.asar');
  if (!fs.existsSync(appAsar)) {
    throw new Error('Нет resources/app.asar');
  }
  const webDist = path.join(resources, 'web-dist', 'index.html');
  if (!fs.existsSync(webDist)) {
    console.warn('[verify] web-dist не в extraResources — тонкий клиент (UI с сервера)');
  } else {
    console.log('[verify] web-dist OK');
  }
  console.log('[verify] Windows unpack OK:', unpacked);
  process.exit(0);
} catch (err) {
  console.error('[verify] FAIL:', err.message);
  process.exit(1);
}
