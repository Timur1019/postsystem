/** Сборка origin для кассы: HTTPS на 443, HTTP на остальных портах. */

const HTTPS_PORTS = new Set(['443', '8443']);

function normalizePort(port) {
  const p = String(port || '').trim();
  return p || '80';
}

function usesHttps(port) {
  return HTTPS_PORTS.has(normalizePort(port));
}

function defaultPortForProtocol(https) {
  return https ? '443' : '80';
}

function buildOrigin(host, port) {
  const h = String(host || '').trim().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  if (!h) return '';
  const p = normalizePort(port);
  const https = usesHttps(p);
  const scheme = https ? 'https' : 'http';
  const def = defaultPortForProtocol(https);
  if (p === def) {
    return `${scheme}://${h}`;
  }
  return `${scheme}://${h}:${p}`;
}

function buildHealthUrl(origin) {
  const base = String(origin || '').replace(/\/$/, '');
  return `${base}/api/v1/actuator/health`;
}

function parseServerUrl(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `http://${url}`);
    const https = u.protocol === 'https:';
    const port = u.port || defaultPortForProtocol(https);
    return { host: u.hostname, port, https, origin: `${u.protocol}//${u.host}` };
  } catch {
    return { host: '', port: '80', https: false, origin: '' };
  }
}

module.exports = {
  HTTPS_PORTS,
  usesHttps,
  buildOrigin,
  buildHealthUrl,
  parseServerUrl,
  normalizePort,
};
