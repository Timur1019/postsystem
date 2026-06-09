const { app } = require('electron');

/** Windows: системный прокси часто ломает прямое подключение к IP:8081. */
function applyDesktopNetworkEnv() {
  app.commandLine.appendSwitch('no-proxy-server');
  process.env.NO_PROXY = '*';
  delete process.env.HTTP_PROXY;
  delete process.env.HTTPS_PROXY;
  delete process.env.http_proxy;
  delete process.env.https_proxy;
}

module.exports = { applyDesktopNetworkEnv };
