let mainWindow = null;
let config = null;
let connectivityTimer = null;

module.exports = {
  getMainWindow: () => mainWindow,
  setMainWindow: (win) => {
    mainWindow = win;
  },
  getConfig: () => config,
  setConfig: (cfg) => {
    config = cfg;
  },
  getConnectivityTimer: () => connectivityTimer,
  setConnectivityTimer: (timer) => {
    connectivityTimer = timer;
  },
};
