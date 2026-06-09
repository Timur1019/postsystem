const http = require('http');
const https = require('https');
const { createHttpAgent } = require('./http-client.cjs');
const { buildApiEndpointUrls } = require('./api-origin.cjs');

function httpPostJson(url, body, { timeoutMs = 12000 } = {}) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve({ ok: false, status: 0, network: true });
      return;
    }
    const payload = JSON.stringify(body);
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;
    const req = client.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: 'POST',
        agent: createHttpAgent(isHttps),
        rejectUnauthorized: false,
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const data = raw ? JSON.parse(raw) : {};
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              data,
              network: false,
            });
          } catch {
            resolve({ ok: false, status: res.statusCode, data: null, network: true });
          }
        });
      },
    );
    req.on('error', () => resolve({ ok: false, status: 0, data: null, network: true }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, data: null, network: true });
    });
    req.write(payload);
    req.end();
  });
}

/**
 * @returns {Promise<{ ok: boolean, reason?: 'invalid'|'network'|'empty' }>}
 */
async function verifyServerSetupPassword(cfg, password) {
  if (!password) return { ok: false, reason: 'empty' };

  const urls = buildApiEndpointUrls(cfg, '/api/v1/public/cashier/server-setup/verify-password');
  if (!urls.length) return { ok: false, reason: 'network' };

  let sawInvalid = false;
  let sawReachable = false;

  for (const url of urls) {
    const result = await httpPostJson(url, { password });
    if (!result.ok) continue;
    sawReachable = true;
    if (result.data?.valid) return { ok: true };
    sawInvalid = true;
  }

  if (sawInvalid) return { ok: false, reason: 'invalid' };
  if (sawReachable) return { ok: false, reason: 'invalid' };
  return { ok: false, reason: 'network' };
}

module.exports = { verifyServerSetupPassword };
