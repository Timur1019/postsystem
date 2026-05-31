/**
 * Отправка ESC/POS-буфера в принтер Windows (тип задания RAW).
 * Не требует npm-пакета printer — только PowerShell + winspool.
 */

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const IS_WIN = process.platform === 'win32';
const PS1_PATH = path.join(__dirname, 'win-raw-print.ps1');

/**
 * @param {string} printerName — точное имя из Windows
 * @param {Buffer} buffer
 */
function printRawBuffer(printerName, buffer) {
  if (!IS_WIN) {
    return Promise.reject(new Error('RAW-печать доступна только в Windows'));
  }
  const name = String(printerName || '').trim();
  if (!name) {
    return Promise.reject(new Error('Принтер не выбран'));
  }
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  if (data.length < 8) {
    return Promise.reject(new Error('Пустой буфер печати'));
  }
  if (!fs.existsSync(PS1_PATH)) {
    return Promise.reject(new Error('win-raw-print.ps1 не найден в сборке'));
  }

  const tmpPath = path.join(os.tmpdir(), `aurent-escpos-${Date.now()}.bin`);
  fs.writeFileSync(tmpPath, data);

  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        PS1_PATH,
        '-PrinterName',
        name,
        '-FilePath',
        tmpPath,
      ],
      { windowsHide: true, timeout: 30000 },
      (err, _stdout, stderr) => {
        fs.unlink(tmpPath, () => {});
        if (err) {
          const detail = (stderr && String(stderr).trim()) || err.message || 'RAW print failed';
          reject(new Error(detail));
          return;
        }
        resolve({ ok: true });
      }
    );
  });
}

module.exports = {
  IS_WIN,
  printRawBuffer,
};
