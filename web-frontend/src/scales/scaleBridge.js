/** API весов в десктоп-кассе (Electron preload). */

export function isDesktopScaleBridge() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.scaleStart);
}

export async function scaleIsAvailable() {
  if (!isDesktopScaleBridge()) return false;
  try {
    return Boolean(await window.desktopCashier.scaleIsAvailable());
  } catch {
    return false;
  }
}

export async function scaleStart() {
  if (!isDesktopScaleBridge()) return { ok: false, mode: 'web' };
  return window.desktopCashier.scaleStart();
}

export async function scaleStop() {
  if (!isDesktopScaleBridge()) return { ok: true };
  return window.desktopCashier.scaleStop();
}

export async function scaleCapture() {
  if (!isDesktopScaleBridge()) return null;
  return window.desktopCashier.scaleCapture();
}

export async function openScalePicker() {
  if (!isDesktopScaleBridge()) return null;
  return window.desktopCashier.openScalePicker();
}

export async function scaleAutoDetect(options = {}) {
  if (!isDesktopScaleBridge()) return { ok: false };
  return window.desktopCashier.scaleAutoDetect(options);
}

export function subscribeScaleWeight(callback) {
  if (!isDesktopScaleBridge() || typeof window.desktopCashier.onScaleWeight !== 'function') {
    return () => {};
  }
  return window.desktopCashier.onScaleWeight(callback);
}
