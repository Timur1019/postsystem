const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { createHttpAgent } = require('./http-client.cjs');
const { logStartup } = require('./startup-log.cjs');

let server;
let activeTarget;
let activePort;

function resolveWebDist() {
  const candidates = [
    path.join(process.resourcesPath, 'web-dist'),
    path.join(__dirname, '..', 'web-dist'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

function createNativeApiProxy(backendOrigin) {
  const target = String(backendOrigin || '').replace(/\/$/, '');
  if (!target) {
    return (_req, res) => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ message: 'Сервер не настроен. Меню Aurent → Настройка сервера.' }));
    };
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return (_req, res) => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ message: 'Неверный адрес сервера в настройках.' }));
    };
  }

  const isHttps = targetUrl.protocol === 'https:';
  const client = isHttps ? https : http;
  const agent = createHttpAgent(isHttps);

  return (req, res) => {
    const headers = { ...req.headers, host: targetUrl.host, connection: 'close' };
    delete headers.origin;
    delete headers.referer;

    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: req.originalUrl,
      method: req.method,
      headers,
      agent,
      rejectUnauthorized: false,
      timeout: 20_000,
    };

    const proxyReq = client.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[Aurent proxy]', target, req.method, req.originalUrl, err.message);
      logStartup('proxy_error', {
        target,
        path: req.originalUrl,
        message: err.message,
      });
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(
          JSON.stringify({
            message:
              `Не удалось связаться с сервером (${target}). ` +
              'Проверьте IP 111.88.132.126, порт 8081, «Настройка сервера».',
          }),
        );
      }
    });

    req.pipe(proxyReq);
  };
}

function startEmbeddedUi({ port, backendOrigin }) {
  const distPath = resolveWebDist();
  if (!distPath) {
    return Promise.resolve(null);
  }

  const target = String(backendOrigin || '').replace(/\/$/, '');
  if (server && activeTarget === target && activePort === port) {
    return Promise.resolve(`http://127.0.0.1:${port}`);
  }
  stopEmbeddedUi();

  const app = express();
  activeTarget = target;
  activePort = port;
  logStartup('embedded_proxy', { target, port, mode: 'native' });

  app.use('/api', createNativeApiProxy(target));
  app.use(express.static(distPath, { index: false }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    server = app.listen(port, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${port}`);
    });
    server.on('error', reject);
  });
}

function stopEmbeddedUi() {
  if (server) {
    server.close();
    server = null;
  }
  activeTarget = null;
  activePort = null;
}

module.exports = { startEmbeddedUi, stopEmbeddedUi, resolveWebDist };
