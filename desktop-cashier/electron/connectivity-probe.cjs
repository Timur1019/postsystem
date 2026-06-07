const { buildHealthUrl } = require('./server-url.cjs');
const { httpGet } = require('./http-client.cjs');

/** Быстрая проверка только backendOrigin — для IPC/баннера, без перебора портов. */
async function probeBackendOnlineQuick(cfg, { timeoutMs = 2500 } = {}) {
  const origin = String(cfg?.backendOrigin || '')
    .trim()
    .replace(/\/api\/v1\/actuator\/health\/?$/i, '')
    .replace(/\/$/, '');
  if (!origin) return false;
  return httpGet(buildHealthUrl(origin), { timeoutMs });
}

module.exports = { probeBackendOnlineQuick };
