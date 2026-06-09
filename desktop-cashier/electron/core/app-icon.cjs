const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const ICON_BASENAME = 'icon';

function brandDir() {
  const candidates = [
    path.join(__dirname, '..', '..', 'assets', 'brand'),
    path.join(process.resourcesPath || '', 'assets', 'brand'),
  ];
  for (const dir of candidates) {
    if (dir && fs.existsSync(dir)) return dir;
  }
  return path.join(__dirname, '..', '..', 'assets', 'brand');
}

function resolveBrandIcon(ext) {
  const file = path.join(brandDir(), `${ICON_BASENAME}.${ext}`);
  return fs.existsSync(file) ? file : null;
}

/** PNG — окно приложения (Win/Linux) и fallback. */
function resolveWindowIcon() {
  return resolveBrandIcon('png') || resolveBrandIcon('ico');
}

/** Платформенная иконка для electron-builder / dock. */
function resolvePlatformIcon() {
  if (process.platform === 'darwin') {
    return resolveBrandIcon('icns') || resolveBrandIcon('png');
  }
  if (process.platform === 'win32') {
    return resolveBrandIcon('ico') || resolveBrandIcon('png');
  }
  return resolveBrandIcon('png');
}

function applyAppIcon() {
  const iconPath = resolvePlatformIcon();
  if (!iconPath) return;

  if (process.platform === 'darwin' && app.dock && typeof app.dock.setIcon === 'function') {
    try {
      app.dock.setIcon(iconPath);
    } catch {
      // ignore dock icon errors
    }
  }
}

module.exports = {
  brandDir,
  resolveWindowIcon,
  resolvePlatformIcon,
  applyAppIcon,
};
