const fs = require('fs');
const path = require('path');

const pkg = require('./package.json');
const build = { ...pkg.build };

const extraResources = [
  { from: 'config.default.json', to: 'config.default.json' },
  { from: 'server.default.json', to: 'server.default.json' },
];

const webDist = path.join(__dirname, 'web-dist', 'index.html');
if (fs.existsSync(webDist)) {
  extraResources.push({ from: 'web-dist', to: 'web-dist', filter: ['**/*'] });
}

build.asarUnpack = [
  '**/node_modules/@thiagoelg/node-printer/**',
  '**/node_modules/serialport/**',
  '**/node_modules/@serialport/**',
  '**/node_modules/node-thermal-printer/**',
  '**/node_modules/iconv-lite/**',
  '**/node_modules/sql.js/**',
];

const sqlWasm = path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
if (fs.existsSync(sqlWasm)) {
  extraResources.push({ from: sqlWasm, to: 'sql.js/sql-wasm.wasm' });
}

build.extraResources = extraResources;

const updateUrl = process.env.DESKTOP_UPDATE_URL || 'http://127.0.0.1/downloads/desktop/';
build.publish = [{ provider: 'generic', url: updateUrl }];

module.exports = build;
