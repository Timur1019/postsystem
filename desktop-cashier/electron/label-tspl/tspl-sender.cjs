const net = require('net');

const DEFAULT_TIMEOUT_MS = 12000;

/**
 * @param {string} host
 * @param {number} port
 * @param {Buffer} buffer
 * @param {number} [timeoutMs]
 */
function sendTsplBuffer(host, port, buffer, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const targetHost = String(host || '').trim();
  const targetPort = Number(port) || 9100;
  if (!targetHost) {
    return Promise.reject(new Error('TSPL: не указан IP-адрес принтера'));
  }
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    return Promise.reject(new Error('TSPL: пустая команда печати'));
  }

  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let settled = false;

    const finish = (err, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        client.destroy();
      } catch {
        // ignore
      }
      if (err) reject(err);
      else resolve(result);
    };

    const timer = setTimeout(() => {
      finish(new Error(`TSPL: принтер ${targetHost}:${targetPort} не ответил (таймаут)`));
    }, timeoutMs);

    client.once('error', (err) => {
      finish(new Error(`TSPL: ${err?.message || 'ошибка сети'}`));
    });

    client.connect(targetPort, targetHost, () => {
      client.write(buffer, (writeErr) => {
        if (writeErr) {
          finish(new Error(`TSPL: ${writeErr.message || 'ошибка отправки'}`));
          return;
        }
        client.end();
        finish(null, { ok: true, host: targetHost, port: targetPort });
      });
    });
  });
}

module.exports = {
  sendTsplBuffer,
  DEFAULT_TIMEOUT_MS,
};
