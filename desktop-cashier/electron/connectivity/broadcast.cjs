const localDb = require('../offline/index.cjs');
const { probeBackendOnlineQuick } = require('./probe.cjs');
const state = require('../bootstrap/state.cjs');

const BROADCAST_INTERVAL_MS = 1_500;
let broadcastActive = false;

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

function scheduleNextBroadcast() {
  if (!broadcastActive) return;
  const timer = setTimeout(async () => {
    await broadcastConnectivity();
    scheduleNextBroadcast();
  }, BROADCAST_INTERVAL_MS);
  state.setConnectivityTimer(timer);
}

function startConnectivityBroadcast() {
  if (broadcastActive) return;
  broadcastActive = true;
  broadcastConnectivity().finally(() => scheduleNextBroadcast());
}

function stopConnectivityBroadcast() {
  broadcastActive = false;
  const timer = state.getConnectivityTimer();
  if (timer) {
    clearTimeout(timer);
    state.setConnectivityTimer(null);
  }
}

module.exports = {
  broadcastConnectivity,
  startConnectivityBroadcast,
  stopConnectivityBroadcast,
};
