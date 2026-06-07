const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
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
  const proxyAgent = target ? createHttpAgent(target.startsWith('https')) : undefined;
  logStartup('embedded_proxy', { target, port });
  // pathFilter без app.use('/api') — иначе Express срезает префикс и ломает /api/v1/*
  app.use(
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      agent: proxyAgent,
      xfwd: true,
      proxyTimeout: 20_000,
      timeout: 20_000,
      pathFilter: (pathname) => pathname.startsWith('/api'),
      on: {
        error: (err, _req, res) => {
          console.error('[Aurent proxy]', target, err.message);
          logStartup('proxy_error', { target, message: err.message });
          if (res && typeof res.writeHead === 'function' && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(
              JSON.stringify({
                message:
                  `Не удалось связаться с сервером (${target || 'не настроен'}). ` +
                  'Проверьте IP, порт 8081 и «Настройка сервера» в меню Aurent.',
              }),
            );
          }
        },
      },
    }),
  );
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
