const { app } = require('electron');
const state = require('../bootstrap/state.cjs');

const ALLOWED_PATH_PREFIXES = ['/login', '/cashier', '/receipt', '/users/barcode-print'];

function normalizeHost(host) {
  return String(host || '')
    .toLowerCase()
    .replace(/^www\./, '');
}

function hostsMatch(a, b) {
  return normalizeHost(a) === normalizeHost(b);
}

function isAllowedLocation(urlString) {
  const config = state.getConfig();
  try {
    const target = new URL(urlString);
    const base = new URL(config.cashierUrl);
    if (!hostsMatch(target.hostname, base.hostname)) {
      return false;
    }
    return ALLOWED_PATH_PREFIXES.some(
      (prefix) => target.pathname === prefix || target.pathname.startsWith(`${prefix}/`),
    );
  } catch {
    return false;
  }
}

function registerTrustedCertificateHandler() {
  app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
    const config = state.getConfig();
    try {
      const target = new URL(url);
      const bases = [config?.cashierUrl, config?.backendOrigin].filter(Boolean);
      const trusted = bases.some((base) => {
        const origin = new URL(base);
        return hostsMatch(target.hostname, origin.hostname);
      });
      if (trusted) {
        event.preventDefault();
        callback(true);
        return;
      }
    } catch {
      // ignore
    }
    callback(false);
  });
}

module.exports = {
  ALLOWED_PATH_PREFIXES,
  hostsMatch,
  isAllowedLocation,
  registerTrustedCertificateHandler,
};
