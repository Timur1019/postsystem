const { buildHealthUrl } = require('./server-url.cjs');
const { httpReachable } = require('./http-client.cjs');
const { collectBackendOrigins } = require('./api-origin.cjs');

/** Проверка backend: любой HTTP-ответ на /actuator/health (даже 503 DOWN). */
async function probeBackendOnlineQuick(cfg, { timeoutMs = 4000 } = {}) {
  const origins = collectBackendOrigins(cfg);
  for (const origin of origins) {
    if (await httpReachable(buildHealthUrl(origin), { timeoutMs })) {
      return true;
    }
  }
  return false;
}

module.exports = { probeBackendOnlineQuick };
