const http = require('http');
const https = require('https');
const { createHttpAgent } = require('./http-client.cjs');

function httpPostJson(url, body, { timeoutMs = 10000 } = {}) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve({ ok: false, status: 0 });
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
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data });
          } catch {
            resolve({ ok: false, status: res.statusCode, data: null });
          }
        });
      },
    );
    req.on('error', () => resolve({ ok: false, status: 0, data: null }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, data: null });
    });
    req.write(payload);
    req.end();
  });
}

async function verifyServerSetupPassword(cfg, password) {
  const origin = String(cfg?.backendOrigin || '').replace(/\/$/, '');
  if (!origin || !password) return false;
  const url = `${origin}/api/v1/public/cashier/server-setup/verify-password`;
  const result = await httpPostJson(url, { password });
  return Boolean(result.ok && result.data?.valid);
}

module.exports = { verifyServerSetupPassword };
