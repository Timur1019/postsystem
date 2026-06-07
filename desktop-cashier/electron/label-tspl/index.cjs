/**
 * TSPL-печать этикеток (XP-365B по сети). Не затрагивает чеки и ESC/POS.
 */
const { readLabelTsplSettings, writeLabelTsplSettings } = require('./tspl-config.cjs');
const { buildTsplBuffer, validateTsplLabelPayload } = require('./tspl-label-builder.cjs');
const { sendTsplBuffer } = require('./tspl-sender.cjs');
const { autoDetectLabelTspl } = require('./tspl-auto-detect.cjs');

async function printLabelTspl(payload) {
  const settings = readLabelTsplSettings();
  if (!settings.enabled) {
    const err = new Error('TSPL-печать отключена. Включите режим TSPL в настройках этикеток.');
    err.code = 'TSPL_DISABLED';
    throw err;
  }

  const host = String(settings.host || '').trim();
  if (!host) {
    const err = new Error('Укажите IP-адрес принтера этикеток (TSPL).');
    err.code = 'TSPL_NO_HOST';
    throw err;
  }

  validateTsplLabelPayload(payload);
  const buffer = buildTsplBuffer({
    ...payload,
    gapMm: Number(payload?.gapMm) || settings.gapMm,
  });

  const port = Number(settings.port) || 9100;
  await sendTsplBuffer(host, port, buffer);

  return {
    ok: true,
    mode: 'tspl',
    target: `${host}:${port}`,
    deviceName: `${host}:${port}`,
  };
}

function registerLabelTsplIpc(ipcMain) {
  ipcMain.handle('desktop:label-tspl-get-settings', () => readLabelTsplSettings());
  ipcMain.handle('desktop:label-tspl-set-settings', (_e, patch) => writeLabelTsplSettings(patch || {}));
  ipcMain.handle('desktop:label-tspl-auto-detect', async (_e, options) => autoDetectLabelTspl(options || {}));
  ipcMain.handle('desktop:print-label-tspl', async (_e, payload) => printLabelTspl(payload));
}

module.exports = {
  registerLabelTsplIpc,
  printLabelTspl,
  readLabelTsplSettings,
  writeLabelTsplSettings,
  buildTsplBuffer,
  validateTsplLabelPayload,
};
