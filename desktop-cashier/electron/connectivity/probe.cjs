const { buildHealthUrl } = require('../core/server-url.cjs');
const { httpGet } = require('../core/http-client.cjs');
const { collectConnectivityProbeOrigins } = require('../core/api-origin.cjs');

/** Проверка удалённого backend: только 2xx/3xx на /actuator/health (502 от локального прокси — offline). */
async function probeBackendOnlineQuick(cfg, { timeoutMs = 4000 } = {}) {
  const origins = collectConnectivityProbeOrigins(cfg);
  for (const origin of origins) {
    if (await httpGet(buildHealthUrl(origin), { timeoutMs })) {
      return true;
    }
  }
  return false;
}

module.exports = { probeBackendOnlineQuick };
