/**
 * Лог запуска кассы (Windows/macOS) — %APPDATA%/Aurent Cashier/startup.log
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function logPath() {
  try {
    return path.join(app.getPath('userData'), 'startup.log');
  } catch {
    return null;
  }
}

/**
 * @param {string} step
 * @param {object} [detail]
 */
function logStartup(step, detail) {
  const file = logPath();
  if (!file) return;
  const line = `${new Date().toISOString()} [${step}] ${detail ? JSON.stringify(detail) : ''}\n`;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, line, 'utf8');
  } catch {
    /* ignore */
  }
  console.log(`[Aurent-startup] ${step}`, detail || '');
}

module.exports = { logStartup, logPath };
