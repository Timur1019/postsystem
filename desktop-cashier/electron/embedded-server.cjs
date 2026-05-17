const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

let server;

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

  const app = express();
  const target = String(backendOrigin || '').replace(/\/$/, '');
  // pathFilter без app.use('/api') — иначе Express срезает префикс и ломает /api/v1/*
  app.use(
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      pathFilter: (pathname) => pathname.startsWith('/api'),
      on: {
        error: (err, _req, res) => {
          console.error('[Aurent proxy]', err.message);
          if (res && typeof res.writeHead === 'function' && !res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(
              JSON.stringify({
                message: 'Не удалось связаться с сервером Aurent. Проверьте IP, порт 8080 и интернет.',
              })
            );
          }
        },
      },
    })
  );
  app.use(express.static(distPath, { index: false }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    if (server) {
      resolve(`http://127.0.0.1:${port}`);
      return;
    }
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
}

module.exports = { startEmbeddedUi, stopEmbeddedUi, resolveWebDist };
