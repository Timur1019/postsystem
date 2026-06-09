const { loadConfig, writeUserConfig } = require('../core/config.cjs');
const { buildOrigin, buildHealthUrl } = require('../core/server-url.cjs');
const { httpGet, httpReachable } = require('../core/http-client.cjs');
const { logStartup } = require('../core/startup-log.cjs');
const { stopEmbeddedUi } = require('./embedded-server.cjs');
const state = require('../bootstrap/state.cjs');

function collectApiHealthUrls(cfg) {
  const urls = [];
  const push = (base) => {
    if (!base) return;
    let b = String(base).trim();
    if (!b) return;
    b = b.replace(/\/api\/v1\/actuator\/health\/?$/i, '').replace(/\/$/, '');
    if (!/^https?:\/\//i.test(b)) {
      b = `http://${b}`;
    }
    urls.push(buildHealthUrl(b));
  };
  if (cfg.useEmbedded && cfg.cashierUrl) {
    push(cfg.cashierUrl);
  }
  push(cfg.apiHealthUrl);
  push(cfg.backendOrigin);
  if (cfg.useRemoteUi && cfg.cashierUrl) {
    push(cfg.cashierUrl);
  }
  try {
    const u = new URL(cfg.backendOrigin || cfg.cashierUrl || 'http://127.0.0.1');
    const host = u.hostname;
    if (host && host !== '127.0.0.1' && host !== 'localhost') {
      const seen = new Set(urls);
      const preferredPort = String(cfg.apiPort || u.port || '').trim();
      if (preferredPort) {
        const preferred = buildHealthUrl(buildOrigin(host, preferredPort));
        urls.unshift(preferred);
        seen.add(preferred);
      }
      for (const port of ['8081', '443', '80', '8080']) {
        const line = buildHealthUrl(buildOrigin(host, port));
        if (!seen.has(line)) urls.push(line);
      }
    }
  } catch {
    // ignore
  }
  return [...new Set(urls)];
}

async function autoRepairBackendOrigin() {
  const config = state.getConfig();
  const directHealth = buildHealthUrl(config.backendOrigin);
  if (await httpReachable(directHealth)) {
    logStartup('backend_ok', { backendOrigin: config.backendOrigin });
    return config;
  }

  logStartup('backend_unreachable', {
    backendOrigin: config.backendOrigin,
    directHealth,
  });

  const urls = collectApiHealthUrls(config);
  for (const url of urls) {
    if (url === directHealth) continue;
    if (!(await httpReachable(url))) continue;
    const origin = url.replace(/\/api\/v1\/actuator\/health\/?$/i, '').replace(/\/$/, '');
    try {
      const u = new URL(origin.startsWith('http') ? origin : `http://${origin}`);
      const apiPort = u.port || (u.protocol === 'https:' ? '443' : '80');
      const backendOrigin = `${u.protocol}//${u.host}`;
      writeUserConfig({
        backendOrigin,
        apiPort: String(apiPort),
        webPort: String(apiPort),
        apiHealthUrl: url,
        useRemoteUi: false,
      });
      stopEmbeddedUi();
      const next = loadConfig();
      state.setConfig(next);
      logStartup('config_auto_repaired', { backendOrigin: next.backendOrigin, healthUrl: url });
      return next;
    } catch {
      // try next url
    }
  }
  return config;
}

async function probeApiHealth(cfg) {
  const urls = collectApiHealthUrls(cfg);
  for (const url of urls) {
    if (!(await httpReachable(url, { timeoutMs: 8000 }))) continue;
    const healthy = await httpGet(url);
    logStartup(healthy ? 'health_ok' : 'health_degraded', { url, healthy });
    return { ok: true, url, healthy };
  }
  logStartup('health_failed_all', { tried: urls.slice(0, 6), backendOrigin: cfg.backendOrigin });
  return { ok: false, tried: urls };
}

module.exports = {
  collectApiHealthUrls,
  autoRepairBackendOrigin,
  probeApiHealth,
};
