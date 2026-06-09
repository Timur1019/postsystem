/**
 * Автопоиск сетевого принтера этикеток (TSPL, порт 9100).
 * Не затрагивает чеки и ESC/POS.
 */
const os = require('os');
const net = require('net');
const { readPrinterSettings } = require('../core/config.cjs');
const { readLabelTsplSettings, writeLabelTsplSettings } = require('./tspl-config.cjs');

const LABEL_NAME_RE =
  /label|zebra|tsc|barcode|этикет|штрих|godex|argox|xprinter.*365|xp-365|xp365|365b/i;

const SCAN_CONCURRENCY = 28;
const TCP_PROBE_MS = 380;
const TSPL_PROBE_MS = 700;
const MAX_SUBNETS = 2;

function extractIpv4(text) {
  const raw = String(text || '').trim();
  const normalized = raw.replace(/^IP_/i, '');
  const match = normalized.match(
    /\b((?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})\b/,
  );
  return match ? match[1] : '';
}

function loadNodePrinter() {
  try {
    return require('@thiagoelg/node-printer');
  } catch {
    return null;
  }
}

function readWindowsPrinterPort(printerName) {
  const driver = loadNodePrinter();
  if (!driver?.getPrinter || !printerName) return '';
  try {
    const info = driver.getPrinter(String(printerName));
    return String(info?.portName || info?.options?.['port-name'] || '').trim();
  } catch {
    return '';
  }
}

/**
 * IP из порта Windows-принтера этикеток (IP_192.168.x.x и т.п.).
 */
function detectFromWindowsLabelPrinter() {
  const { labelPrinterName } = readPrinterSettings();
  const name = String(labelPrinterName || '').trim();
  if (!name) return null;

  const portName = readWindowsPrinterPort(name);
  const ip = extractIpv4(portName) || extractIpv4(name);
  if (!ip) return null;

  return {
    host: ip,
    source: 'windows_printer',
    detail: portName || name,
    printerName: name,
  };
}

function localSubnetBases() {
  const bases = new Set();
  const ifaces = os.networkInterfaces();
  for (const entries of Object.values(ifaces)) {
    for (const entry of entries || []) {
      const family = entry?.family;
      if (family !== 'IPv4' && family !== 4) continue;
      if (entry.internal) continue;
      const parts = String(entry.address || '').split('.');
      if (parts.length !== 4) continue;
      bases.add(`${parts[0]}.${parts[1]}.${parts[2]}`);
    }
  }
  return [...bases].slice(0, MAX_SUBNETS);
}

function probeTcpOpen(host, port, timeoutMs = TCP_PROBE_MS) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    socket.once('error', () => finish(false));
    socket.connect(port, host, () => finish(true));
  });
}

function probeTsplIdentity(host, port, timeoutMs = TSPL_PROBE_MS) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    let response = '';

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish(response ? { ok: true, response } : { ok: true, response: '' });
    }, timeoutMs);

    socket.once('error', () => finish({ ok: false, response: '' }));
    socket.on('data', (chunk) => {
      response += chunk.toString('latin1');
    });
    socket.connect(port, host, () => {
      socket.write('\r\n~!T\r\n');
    });
  });
}

function scoreCandidate(candidate) {
  let score = Number(candidate.confidence) || 0;
  const hay = `${candidate.detail || ''} ${candidate.response || ''} ${candidate.printerName || ''}`.toLowerCase();
  if (LABEL_NAME_RE.test(hay)) score += 25;
  if (candidate.source === 'windows_printer') score += 20;
  if (candidate.reachable) score += 10;
  if (candidate.tsplLike) score += 15;
  return score;
}

async function scanSubnetForPort(base, port) {
  const hosts = [];
  for (let i = 1; i <= 254; i += 1) {
    hosts.push(`${base}.${i}`);
  }

  const openHosts = [];
  for (let i = 0; i < hosts.length; i += SCAN_CONCURRENCY) {
    const batch = hosts.slice(i, i + SCAN_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (host) => ((await probeTcpOpen(host, port)) ? host : null)),
    );
    for (const host of results) {
      if (host) openHosts.push(host);
    }
  }
  return openHosts;
}

/**
 * @param {{ port?: number, save?: boolean, skipNetworkScan?: boolean }} [options]
 */
async function autoDetectLabelTspl(options = {}) {
  const settings = readLabelTsplSettings();
  const port = Number(options.port) || settings.port || 9100;
  const byHost = new Map();

  const pushCandidate = (raw) => {
    const host = String(raw.host || '').trim();
    if (!host) return;
    const existing = byHost.get(host);
    const next = {
      host,
      port,
      source: raw.source || 'unknown',
      detail: raw.detail || '',
      printerName: raw.printerName || '',
      response: raw.response || '',
      reachable: raw.reachable !== false,
      tsplLike: Boolean(raw.tsplLike),
      confidence: Number(raw.confidence) || 50,
    };
    if (!existing || scoreCandidate(next) > scoreCandidate(existing)) {
      byHost.set(host, next);
    }
  };

  const fromWindows = detectFromWindowsLabelPrinter();
  if (fromWindows) {
    const reachable = await probeTcpOpen(fromWindows.host, port);
    pushCandidate({
      ...fromWindows,
      reachable,
      confidence: reachable ? 90 : 55,
    });
  }

  if (!options.skipNetworkScan) {
    const subnets = localSubnetBases();
    for (const base of subnets) {
      const openHosts = await scanSubnetForPort(base, port);
      for (const host of openHosts) {
        if (byHost.has(host)) continue;
        const probe = await probeTsplIdentity(host, port);
        const response = String(probe.response || '');
        pushCandidate({
          host,
          source: 'network_scan',
          detail: response ? response.replace(/\s+/g, ' ').trim().slice(0, 120) : `TCP ${port}`,
          reachable: true,
          tsplLike: /tspl|tsc|xprinter|zebra|barcode|printer|365/i.test(response),
          confidence: probe.ok ? 65 : 50,
          response,
        });
      }
    }
  }

  const candidates = [...byHost.values()]
    .map((c) => ({ ...c, score: scoreCandidate(c) }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0] || null;

  if (options.save && best?.host) {
    writeLabelTsplSettings({
      host: best.host,
      port,
      enabled: settings.enabled !== false,
    });
  }

  return {
    ok: Boolean(best),
    port,
    subnets: localSubnetBases(),
    candidates,
    best,
    saved: Boolean(options.save && best?.host),
  };
}

module.exports = {
  autoDetectLabelTspl,
  detectFromWindowsLabelPrinter,
  extractIpv4,
  localSubnetBases,
};
