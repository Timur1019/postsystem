const localDb = require('./index.cjs');

/**
 * Один атомарный офлайн-чекаут в main process (без цепочки IPC).
 */
async function completeLocalCheckout({
  storeId,
  cashierId,
  cashierName,
  storeName,
  cachedShift,
  payload,
  response,
  stockLines = [],
}) {
  if (!storeId || !cashierId) {
    throw new Error('OFFLINE_SHIFT_REQUIRED');
  }

  let shift = localDb.mapLocalShift(await localDb.getOpenShift({ storeId, cashierId }));

  if (!shift || shift.status !== 'OPEN') {
    if (cachedShift?.status === 'OPEN') {
      shift = await localDb.syncServerShiftToLocal({
        shift: cachedShift,
        storeId,
        cashierId,
        cashierName: cashierName || cachedShift.cashierName || '',
        storeName: storeName || cachedShift.storeName || '',
      });
    }
  }

  if (!shift || shift.status !== 'OPEN') {
    shift = await localDb.openLocalShift({
      storeId,
      cashierId,
      cashierName: cashierName || '',
      storeName: storeName || '',
    });
  }

  if (!shift || shift.status !== 'OPEN') {
    throw new Error('OFFLINE_SHIFT_REQUIRED');
  }

  const clientShiftId = shift.id || shift.clientShiftId;
  const saved = await localDb.saveLocalSale({
    clientShiftId,
    payload,
    response,
  });

  if (!saved?.clientSaleId) {
    throw new Error('OFFLINE_SALE_SAVE_FAILED');
  }

  if (stockLines.length) {
    await localDb.decreaseLocalStockBatch(stockLines);
  }

  return {
    ...saved,
    shiftId: clientShiftId,
  };
}

module.exports = { completeLocalCheckout };
