const localDb = require('../offline/index.cjs');
const { probeBackendOnlineQuick } = require('./probe.cjs');
const state = require('../bootstrap/state.cjs');

async function broadcastConnectivity() {
  const mainWindow = state.getMainWindow();
  const config = state.getConfig();
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    const bootstrap = await localDb.getBootstrapStatus();
    let apiOnline = false;
    try {
      apiOnline = await probeBackendOnlineQuick(config);
    } catch {
      apiOnline = false;
    }
    mainWindow.webContents.send('offline:connectivity', {
      ...bootstrap,
      apiOnline,
      offlineMode: !apiOnline,
      canSellOffline: bootstrap.bootstrapReady && bootstrap.productCount > 0,
    });
  } catch {
    // ignore broadcast errors
  }
}

function startConnectivityBroadcast() {
  if (state.getConnectivityTimer()) return;
  broadcastConnectivity();
  state.setConnectivityTimer(setInterval(broadcastConnectivity, 1_500));
}

function stopConnectivityBroadcast() {
  const timer = state.getConnectivityTimer();
  if (timer) {
    clearInterval(timer);
    state.setConnectivityTimer(null);
  }
}

module.exports = {
  broadcastConnectivity,
  startConnectivityBroadcast,
  stopConnectivityBroadcast,
};
