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

build.extraResources = extraResources;

module.exports = build;
