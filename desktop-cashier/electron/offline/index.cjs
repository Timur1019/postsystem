const { getDb, ensureDeviceId } = require('./db/connection.cjs');
const catalog = require('./db/catalog.cjs');
const shifts = require('./db/shifts.cjs');
const sales = require('./db/sales.cjs');

module.exports = {
  getDb,
  ensureDeviceId,
  ...catalog,
  ...shifts,
  ...sales,
};
