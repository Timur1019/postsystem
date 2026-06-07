const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_PORT = 9100;
const DEFAULT_GAP_MM = 2;

function userConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function readUserConfig() {
  try {
    const file = userConfigPath();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch {
    // ignore
  }
  return {};
}

function readLabelTsplSettings() {
  const cfg = readUserConfig();
  return {
    enabled: cfg.labelTsplEnabled === true,
    host: String(cfg.labelTsplHost || '').trim(),
    port: Number(cfg.labelTsplPort) || DEFAULT_PORT,
    gapMm: Number(cfg.labelTsplGapMm) || DEFAULT_GAP_MM,
  };
}

function writeLabelTsplSettings(patch) {
  const file = userConfigPath();
  const merged = { ...readUserConfig() };
  if (typeof patch?.enabled === 'boolean') merged.labelTsplEnabled = patch.enabled;
  if (typeof patch?.host === 'string') merged.labelTsplHost = patch.host.trim();
  if (patch?.port != null) merged.labelTsplPort = Number(patch.port) || DEFAULT_PORT;
  if (patch?.gapMm != null) merged.labelTsplGapMm = Number(patch.gapMm) || DEFAULT_GAP_MM;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf8');
  return readLabelTsplSettings();
}

module.exports = {
  DEFAULT_PORT,
  DEFAULT_GAP_MM,
  readLabelTsplSettings,
  writeLabelTsplSettings,
};
