#!/usr/bin/env node
/**
 * Собирает @thiagoelg/node-printer под версию Electron из desktop-cashier.
 * Вызывается при npm install (postinstall) и перед dist:win / CI.
 * Кассиру после установки .exe ничего запускать не нужно.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const required = process.argv.includes('--required') || process.env.REQUIRE_NATIVE_PRINTER === '1';
const skip = process.env.SKIP_NATIVE_PRINTER === '1';
const isDarwin = process.platform === 'darwin';

function log(msg) {
  console.log(`[desktop-cashier] ${msg}`);
}

if (skip) {
  log('SKIP_NATIVE_PRINTER=1 — пропуск сборки драйвера принтера');
  process.exit(0);
}

/** ESC/POS на кассах — только Windows; Mac .dmg без native-модуля. */
if (isDarwin && !required) {
  log('macOS — пропуск @thiagoelg/node-printer (печать чека только в Windows .exe)');
  process.exit(0);
}

const electronPkg = path.join(root, 'node_modules', 'electron', 'package.json');
if (!fs.existsSync(electronPkg)) {
  const msg = 'electron не установлен — сборка native-принтера отложена';
  if (required) {
    console.error(`[desktop-cashier] ${msg}`);
    process.exit(1);
  }
  log(`${msg} (нормально для npm install --omit=dev)`);
  process.exit(0);
}

const printerDir = path.join(root, 'node_modules', '@thiagoelg', 'node-printer');
if (!fs.existsSync(printerDir)) {
  const msg = 'Пакет @thiagoelg/node-printer не найден. Выполните: npm install';
  console.error(`[desktop-cashier] ${msg}`);
  process.exit(required ? 1 : 0);
}

log('Сборка @thiagoelg/node-printer для Electron…');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npx,
  ['@electron/rebuild', '-f', '-w', '@thiagoelg/node-printer'],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
);

if (result.status === 0) {
  log('Драйвер принтера для Electron готов');
  process.exit(0);
}

const hint =
  'Не удалось собрать драйвер ESC/POS. На Windows: Visual Studio Build Tools, затем npm run rebuild:native --required';

if (required) {
  console.error(`[desktop-cashier] ${hint}`);
  process.exit(result.status || 1);
}

console.warn(`[desktop-cashier] ${hint}`);
console.warn('[desktop-cashier] ESC/POS на этой машине может не работать до успешной сборки установщика на Windows');
process.exit(0);
