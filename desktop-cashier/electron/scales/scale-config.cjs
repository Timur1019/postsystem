const fs = require('fs');
const path = require('path');
const { app } = require('electron');

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

function readScaleSettings() {
  const cfg = readUserConfig();
  return {
    port: String(cfg.scalePort || '').trim(),
    baudRate: Number(cfg.scaleBaudRate || 9600),
    mock: cfg.scaleMock === true,
    stableOnly: cfg.scaleStableOnly !== false,
  };
}

function writeScaleSettings(patch) {
  const file = userConfigPath();
  const current = readUserConfig();
  const merged = { ...current };
  if (typeof patch?.scalePort === 'string') merged.scalePort = patch.scalePort.trim();
  if (patch?.scaleBaudRate != null) merged.scaleBaudRate = Number(patch.scaleBaudRate) || 9600;
  if (typeof patch?.scaleMock === 'boolean') merged.scaleMock = patch.scaleMock;
  if (typeof patch?.scaleStableOnly === 'boolean') merged.scaleStableOnly = patch.scaleStableOnly;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf8');
  return readScaleSettings();
}

module.exports = { readScaleSettings, writeScaleSettings };
