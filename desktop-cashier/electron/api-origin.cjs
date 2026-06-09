const { buildOrigin } = require('./server-url.cjs');

function normalizeOrigin(raw) {
  return String(raw || '')
    .trim()
    .replace(/\/api\/v1\/actuator\/health\/?$/i, '')
    .replace(/\/api\/v1\/?$/i, '')
    .replace(/\/$/, '');
}

/** Все origin, через которые desktop может достучаться до API (прокси + прямой сервер). */
function collectBackendOrigins(cfg) {
  const origins = [];
  const push = (raw) => {
    const origin = normalizeOrigin(raw);
    if (!origin || origins.includes(origin)) return;
    origins.push(origin);
  };

  if (cfg?.useEmbedded && cfg?.embeddedPort) {
    push(`http://127.0.0.1:${cfg.embeddedPort}`);
  }

  push(cfg?.backendOrigin);
  if (cfg?.apiHealthUrl) {
    push(String(cfg.apiHealthUrl).replace(/\/api\/v1\/actuator\/health\/?$/i, ''));
  }
  if (cfg?.useRemoteUi && cfg?.cashierUrl) {
    push(cfg.cashierUrl);
  }

  try {
    const base = normalizeOrigin(cfg?.backendOrigin) || normalizeOrigin(cfg?.cashierUrl);
    if (!base) return origins;
    const u = new URL(base.startsWith('http') ? base : `http://${base}`);
    const host = u.hostname;
    if (!host || host === '127.0.0.1' || host === 'localhost') return origins;

    const preferredPort = String(cfg?.apiPort || u.port || '').trim();
    if (preferredPort) {
      push(buildOrigin(host, preferredPort));
    }
    for (const port of ['8081', '443', '80', '8080']) {
      push(buildOrigin(host, port));
    }
  } catch {
    // ignore parse errors
  }

  return origins;
}

function buildApiEndpointUrls(cfg, apiPath) {
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  return collectBackendOrigins(cfg).map((origin) => `${origin}${path}`);
}

module.exports = {
  normalizeOrigin,
  collectBackendOrigins,
  buildApiEndpointUrls,
};
