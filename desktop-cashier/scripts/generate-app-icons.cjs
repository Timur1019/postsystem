#!/usr/bin/env node
/**
 * Генерация icon.png / icon.ico / icon.icns из assets/brand/icon.svg
 * Запуск: npm run icons  (из desktop-cashier/)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BRAND_DIR = path.join(ROOT, 'assets', 'brand');
const SVG = path.join(BRAND_DIR, 'icon.svg');
const PNG = path.join(BRAND_DIR, 'icon.png');
const ICO = path.join(BRAND_DIR, 'icon.ico');
const ICNS = path.join(BRAND_DIR, 'icon.icns');

async function generateWithSharp() {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const sharp = require('sharp');
  const svg = fs.readFileSync(SVG);
  await sharp(svg).resize(1024, 1024).png().toFile(PNG);
  console.log('  ✓ icon.png (1024)');

  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const pngToIco = require('png-to-ico');
    const buf = await pngToIco(PNG);
    fs.writeFileSync(ICO, buf);
    console.log('  ✓ icon.ico');
  } catch (err) {
    console.warn('  ! icon.ico skip:', err?.message || err);
  }
}

function generateIcnsOnMac() {
  if (process.platform !== 'darwin') return;
  const iconset = path.join(BRAND_DIR, 'icon.iconset');
  fs.rmSync(iconset, { recursive: true, force: true });
  fs.mkdirSync(iconset, { recursive: true });
  const sizes = [16, 32, 64, 128, 256, 512, 1024];
  for (const size of sizes) {
    execSync(`sips -z ${size} ${size} "${PNG}" --out "${path.join(iconset, `icon_${size}x${size}.png`)}"`, {
      stdio: 'ignore',
    });
    if (size <= 512) {
      execSync(
        `sips -z ${size * 2} ${size * 2} "${PNG}" --out "${path.join(iconset, `icon_${size}x${size}@2x.png`)}"`,
        { stdio: 'ignore' },
      );
    }
  }
  execSync(`iconutil -c icns "${iconset}" -o "${ICNS}"`, { stdio: 'ignore' });
  fs.rmSync(iconset, { recursive: true, force: true });
  console.log('  ✓ icon.icns');
}

async function main() {
  if (!fs.existsSync(SVG)) {
    console.error('Missing', SVG);
    process.exit(1);
  }
  console.log('Aurent — generate app icons\n');
  try {
    await generateWithSharp();
  } catch (err) {
    console.error('Install sharp: npm install --save-dev sharp png-to-ico');
    console.error(err?.message || err);
    process.exit(1);
  }
  try {
    generateIcnsOnMac();
  } catch (err) {
    console.warn('  ! icon.icns skip:', err?.message || err);
  }
  console.log('\nDone.');
}

main();
