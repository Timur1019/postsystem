const { ipcMain } = require('electron');
const localDb = require('./local-db.cjs');

function registerOfflineIpc(getConfig, probeApiHealth) {
  ipcMain.handle('offline:get-status', async () => {
    const bootstrap = await localDb.getBootstrapStatus();
    let apiOnline = false;
    try {
      const cfg = getConfig?.();
      if (cfg && probeApiHealth) {
        const probe = await probeApiHealth(cfg);
        apiOnline = Boolean(probe?.ok);
      }
    } catch {
      apiOnline = false;
    }
    return {
      ...bootstrap,
      apiOnline,
      offlineMode: !apiOnline,
      canSellOffline: bootstrap.bootstrapReady && bootstrap.productCount > 0,
    };
  });

  ipcMain.handle('offline:import-bootstrap', async (_e, payload) => localDb.importBootstrap(payload));

  ipcMain.handle('offline:list-categories', async () => localDb.listCategories());

  ipcMain.handle('offline:search-products', async (_e, opts) => localDb.searchProducts(opts || {}));

  ipcMain.handle('offline:get-product-by-barcode', async (_e, barcode) =>
    localDb.getProductByBarcode(barcode),
  );

  ipcMain.handle('offline:get-current-shift', async (_e, { storeId, cashierId }) => {
    const row = await localDb.getOpenShift({ storeId, cashierId });
    return localDb.mapLocalShift(row);
  });

  ipcMain.handle('offline:open-shift', async (_e, payload) =>
    localDb.openLocalShift(payload || {}),
  );

  ipcMain.handle('offline:save-sale', async (_e, payload) => localDb.saveLocalSale(payload || {}));

  ipcMain.handle('offline:list-pending-sales', async () => localDb.listPendingSales());

  ipcMain.handle('offline:list-my-sales', async (_e, opts) => localDb.listMySales(opts || {}));

  ipcMain.handle('offline:mark-sales-synced', async (_e, results) =>
    localDb.markSalesSynced(results),
  );

  ipcMain.handle('offline:decrease-stock', async (_e, { productId, quantity }) =>
    localDb.decreaseLocalStock(productId, quantity),
  );
}

module.exports = { registerOfflineIpc };
