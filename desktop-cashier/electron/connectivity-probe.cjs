const { buildHealthUrl } = require('./server-url.cjs');
const { httpGet } = require('./http-client.cjs');
const { collectBackendOrigins } = require('./api-origin.cjs');

/** Проверка backend: локальный прокси (embedded) + прямой origin + запасные порты. */
async function probeBackendOnlineQuick(cfg, { timeoutMs = 4000 } = {}) {
  const origins = collectBackendOrigins(cfg);
  for (const origin of origins) {
    if (await httpGet(buildHealthUrl(origin), { timeoutMs })) {
      return true;
    }
  }
  return false;
}

module.exports = { probeBackendOnlineQuick };
