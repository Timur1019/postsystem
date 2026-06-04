const { parseScaleLine } = require('./scale-parser.cjs');
const { tryLoadSerialPort, listSerialPorts } = require('./scale-serial-port.cjs');
const { readScaleSettings, writeScaleSettings } = require('./scale-config.cjs');

const SCALE_NAME_RE =
  /scale|scales|вес|cas|digi|mettler|shtrix|штрих|tm-|pos scale|balance|весы/i;

function scorePort(port) {
  const hay = `${port.friendlyName || ''} ${port.manufacturer || ''} ${port.path || ''}`;
  let score = 0;
  if (SCALE_NAME_RE.test(hay)) score += 50;
  if (/usb|serial|com/i.test(hay)) score += 5;
  if (/bluetooth/i.test(hay)) score -= 10;
  return score;
}

function rankPorts(ports) {
  return [...ports].sort((a, b) => scorePort(b) - scorePort(a));
}

function probePort(path, baudRate, timeoutMs = 2800) {
  const { SerialPort, ReadlineParser, error } = tryLoadSerialPort();
  if (error) {
    return Promise.resolve({ ok: false, path, error });
  }

  return new Promise((resolve) => {
    let port;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const closeAndResolve = () => resolve({ ...result, path });
      if (port?.isOpen) {
        port.close(() => closeAndResolve());
      } else {
        closeAndResolve();
      }
    };

    let timer;
    try {
      port = new SerialPort({ path, baudRate, autoOpen: false });
      const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      parser.on('data', (line) => {
        const parsed = parseScaleLine(line);
        if (parsed && parsed.kg > 0) {
          finish({ ok: true, reading: parsed, reason: 'data' });
        }
      });

      port.on('error', (err) => finish({ ok: false, error: err?.message || 'port error' }));

      port.open((err) => {
        if (err) {
          finish({ ok: false, error: err.message });
          return;
        }
        timer = setTimeout(() => finish({ ok: false, error: 'timeout', reason: 'no-data' }), timeoutMs);
      });
    } catch (err) {
      finish({ ok: false, error: err?.message || String(err) });
    }
  });
}

/** Открывается ли порт (без ожидания данных с весов). */
function probePortOpenOnly(path, baudRate) {
  const { SerialPort, error } = tryLoadSerialPort();
  if (error) return Promise.resolve({ ok: false, error });

  return new Promise((resolve) => {
    let port;
    const finish = (result) => {
      if (port?.isOpen) port.close(() => resolve(result));
      else resolve(result);
    };
    try {
      port = new SerialPort({ path, baudRate, autoOpen: false });
      port.on('error', (err) => finish({ ok: false, error: err?.message }));
      port.open((err) => {
        if (err) finish({ ok: false, error: err.message });
        else finish({ ok: true, reason: 'open-only' });
      });
    } catch (err) {
      finish({ ok: false, error: err?.message });
    }
  });
}

/**
 * Автопоиск COM-порта весов. При успехе сохраняет scalePort в config.json.
 */
async function autoDetectPort({ save = true, baudRate } = {}) {
  const settings = readScaleSettings();
  const rate = Number(baudRate || settings.baudRate || process.env.POS_SCALE_BAUD || 9600);
  const { ports, error: listError } = await listSerialPorts();
  if (listError) {
    return { ok: false, error: listError, ports: [] };
  }
  if (!ports.length) {
    return { ok: false, error: 'COM-порты не найдены. Подключите весы и установите драйвер.', ports: [] };
  }

  const saved = String(settings.port || process.env.POS_SCALE_PORT || '').trim();
  const ordered = rankPorts(ports);
  const tryOrder = [];

  if (saved) {
    const savedPort = ports.find((p) => p.path === saved);
    if (savedPort) tryOrder.push(savedPort);
  }
  for (const p of ordered) {
    if (!tryOrder.some((x) => x.path === p.path)) tryOrder.push(p);
  }

  for (const portInfo of tryOrder) {
    const probe = await probePort(portInfo.path, rate);
    if (probe.ok) {
      if (save) writeScaleSettings({ scalePort: portInfo.path, scaleBaudRate: rate });
      return {
        ok: true,
        port: portInfo.path,
        baudRate: rate,
        method: 'weight-data',
        reading: probe.reading,
        portInfo,
      };
    }
  }

  if (ports.length === 1) {
    const only = ports[0];
    const openProbe = await probePortOpenOnly(only.path, rate);
    if (openProbe.ok) {
      if (save) writeScaleSettings({ scalePort: only.path, scaleBaudRate: rate });
      return {
        ok: true,
        port: only.path,
        baudRate: rate,
        method: 'single-com-open',
        portInfo: only,
        hint: 'Порт открыт; положите товар на весы для проверки.',
      };
    }
  }

  return {
    ok: false,
    error: 'Не удалось получить вес ни с одного COM-порта. Выберите порт вручную.',
    ports,
    tried: tryOrder.map((p) => p.path),
  };
}

module.exports = {
  rankPorts,
  probePort,
  probePortOpenOnly,
  autoDetectPort,
  scorePort,
};
