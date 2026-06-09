const http = require('http');
const https = require('https');

/** Общий агент: самоподписанные сертификаты + IPv4 (Windows чаще ломается на IPv6). */
function createHttpAgent(isHttps) {
  const family = 4;
  if (isHttps) {
    return new https.Agent({ rejectUnauthorized: false, family });
  }
  return new http.Agent({ family });
}

function httpRequest(url, { timeoutMs = 8000, acceptStatus } = {}) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve(false);
      return;
    }
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;
    const req = client.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: 'GET',
        agent: createHttpAgent(isHttps),
        rejectUnauthorized: false,
        timeout: timeoutMs,
      },
      (res) => {
        res.resume();
        resolve(acceptStatus(res.statusCode));
      },
    );
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

/** 2xx/3xx — успешный ответ. */
function httpGet(url, options = {}) {
  return httpRequest(url, {
    ...options,
    acceptStatus: (code) => code >= 200 && code < 400,
  });
}

/** Любой HTTP-ответ = сервер доступен (503 health DOWN всё равно значит, что API жив). */
function httpReachable(url, options = {}) {
  return httpRequest(url, {
    ...options,
    acceptStatus: (code) => Number.isFinite(code) && code > 0,
  });
}

module.exports = { createHttpAgent, httpGet, httpReachable };
