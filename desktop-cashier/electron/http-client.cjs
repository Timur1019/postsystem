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

function httpGet(url, { timeoutMs = 8000 } = {}) {
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
        resolve(res.statusCode >= 200 && res.statusCode < 400);
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

module.exports = { createHttpAgent, httpGet };
