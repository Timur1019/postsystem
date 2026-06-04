/** Опциональный serialport — без него весы работают только в mock-режиме. */

function tryLoadSerialPort() {
  try {
    const { SerialPort } = require('serialport');
    const { ReadlineParser } = require('@serialport/parser-readline');
    return { SerialPort, ReadlineParser, error: null };
  } catch (err) {
    return { SerialPort: null, ReadlineParser: null, error: err?.message || String(err) };
  }
}

async function listSerialPorts() {
  const { SerialPort, error } = tryLoadSerialPort();
  if (error) return { ports: [], error };
  const ports = await SerialPort.list();
  return {
    ports: ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer || '',
      serialNumber: p.serialNumber || '',
      friendlyName: p.friendlyName || p.path,
    })),
  };
}

module.exports = { tryLoadSerialPort, listSerialPorts };
