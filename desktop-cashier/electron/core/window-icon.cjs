const { resolveWindowIcon } = require('./app-icon.cjs');

function windowIconOptions() {
  const icon = resolveWindowIcon();
  return icon ? { icon } : {};
}

module.exports = { windowIconOptions };
