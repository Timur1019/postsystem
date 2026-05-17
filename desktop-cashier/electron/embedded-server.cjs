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
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendOrigin,
      changeOrigin: true,
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
