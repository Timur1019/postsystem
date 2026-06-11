const { ipcMain } = require('electron');
const localDb = require('./index.cjs');
const { completeLocalCheckout } = require('./checkout.cjs');

const IPC_TIMEOUT_MS = 16_000;
const CHECKOUT_IPC_TIMEOUT_MS = 8_000;

async function safeOffline(fn, fallback) {
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('offline_ipc_timeout')), IPC_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    console.error('[offline ipc]', err?.message || err);
    return fallback;
  }
}

function registerOfflineIpc(getConfig, probeBackendOnlineQuick) {
  ipcMain.handle('offline:get-status', async () => {
    const bootstrap = await safeOffline(() => localDb.getBootstrapStatus(), {
      deviceId: null,
      storeId: null,
      storeName: '',
      lastCatalogSyncAt: null,
      bootstrapReady: false,
      productCount: 0,
      pendingSales: 0,
    });
    let apiOnline = false;
    try {
      const cfg = getConfig?.();
      if (cfg && probeBackendOnlineQuick) {
        apiOnline = await Promise.race([
          probeBackendOnlineQuick(cfg, { timeoutMs: 2000 }),
          new Promise((resolve) => {
            setTimeout(() => resolve(false), 2500);
          }),
        ]);
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

  ipcMain.handle('offline:import-bootstrap', async (_e, payload) =>
    safeOffline(() => localDb.importBootstrap(payload), { ok: false, error: 'offline_db_unavailable' }),
  );

  ipcMain.handle('offline:list-categories', async () =>
    safeOffline(() => localDb.listCategories(), []),
  );

  ipcMain.handle('offline:search-products', async (_e, opts) =>
    safeOffline(() => localDb.searchProducts(opts || {}), []),
  );

  ipcMain.handle('offline:get-product-by-barcode', async (_e, barcode) =>
    safeOffline(() => localDb.getProductByBarcode(barcode), null),
  );

  ipcMain.handle('offline:get-current-shift', async (_e, { storeId, cashierId }) => {
    const row = await safeOffline(
      () => localDb.getOpenShift({ storeId, cashierId }),
      null,
    );
    return localDb.mapLocalShift(row);
  });

  ipcMain.handle('offline:open-shift', async (_e, payload) =>
    safeOffline(() => localDb.openLocalShift(payload || {}), null),
  );

  ipcMain.handle('offline:sync-shift-from-server', async (_e, payload) =>
    safeOffline(() => localDb.syncServerShiftToLocal(payload || {}), null),
  );

  ipcMain.handle('offline:close-shift', async (_e, payload) =>
    safeOffline(() => localDb.closeLocalShift(payload || {}), { ok: false }),
  );

  ipcMain.handle('offline:save-sale', async (_e, payload) => {
    const result = await safeOffline(() => localDb.saveLocalSale(payload || {}), null);
    if (!result?.clientSaleId) {
      throw new Error('offline_sale_save_failed');
    }
    return result;
  });

  ipcMain.handle('offline:list-pending-sales', async () =>
    safeOffline(() => localDb.listPendingSales(), []),
  );

  ipcMain.handle('offline:list-my-sales', async (_e, opts) =>
    safeOffline(() => localDb.listMySales(opts || {}), []),
  );

  ipcMain.handle('offline:mark-sales-synced', async (_e, results) =>
    safeOffline(() => localDb.markSalesSynced(results), { ok: false }),
  );

  ipcMain.handle('offline:decrease-stock', async (_e, { productId, quantity }) =>
    safeOffline(() => localDb.decreaseLocalStock(productId, quantity), null),
  );

  ipcMain.handle('offline:complete-checkout', async (_e, payload) => {
    try {
      return await Promise.race([
        completeLocalCheckout(payload || {}),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('offline_checkout_timeout')), CHECKOUT_IPC_TIMEOUT_MS);
        }),
      ]);
    } catch (err) {
      console.error('[offline ipc] complete-checkout', err?.message || err);
      throw err;
    }
  });
}

module.exports = { registerOfflineIpc };
