const { buildHealthUrl } = require('../core/server-url.cjs');
const { httpReachable } = require('../core/http-client.cjs');
const { collectConnectivityProbeOrigins } = require('../core/api-origin.cjs');

/** Проверка backend: любой HTTP-ответ на /actuator/health (даже 503 DOWN). */
async function probeBackendOnlineQuick(cfg, { timeoutMs = 4000 } = {}) {
  const origins = collectConnectivityProbeOrigins(cfg);
  for (const origin of origins) {
    if (await httpReachable(buildHealthUrl(origin), { timeoutMs })) {
      return true;
    }
  }
  return false;
}

module.exports = { probeBackendOnlineQuick };
