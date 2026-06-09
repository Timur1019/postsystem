const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const crypto = require('crypto');
const { SCHEMA } = require('./schema.cjs');

let sqlInitPromise;
let db;
let dbPath;

const DB_INIT_TIMEOUT_MS = 15_000;

function resolveSqlWasmFile(file) {
  const fileName = path.basename(file || 'sql-wasm.wasm');
  const candidates = [];
  const push = (p) => {
    if (p) candidates.push(p);
  };

  if (process.resourcesPath) {
    push(path.join(process.resourcesPath, 'sql.js', fileName));
    push(path.join(process.resourcesPath, fileName));
    push(
      path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist', fileName),
    );
  }

  push(path.join(__dirname, '..', '..', '..', 'node_modules', 'sql.js', 'dist', fileName));
  try {
    push(path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', fileName));
  } catch {
    // outside Electron main
  }
  push(path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', fileName));
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`sql.js wasm not found: ${fileName}`);
}

function dbFilePath() {
  if (!dbPath) {
    dbPath = path.join(app.getPath('userData'), 'pos-offline.db');
  }
  return dbPath;
}

function loadSql() {
  if (!sqlInitPromise) {
    // eslint-disable-next-line global-require
    const initSqlJs = require('sql.js');
    sqlInitPromise = initSqlJs({
      locateFile: resolveSqlWasmFile,
    }).catch((err) => {
      sqlInitPromise = null;
      console.error('[offline-db] sql.js init failed:', err);
      throw err;
    });
  }
  return sqlInitPromise;
}

function withDbTimeout(promise, label = 'offline-db') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout`)), DB_INIT_TIMEOUT_MS);
    }),
  ]);
}

function persistDb() {
  if (!db) return;
  const data = db.export();
  fs.mkdirSync(path.dirname(dbFilePath()), { recursive: true });
  fs.writeFileSync(dbFilePath(), Buffer.from(data));
}

function rowsFromStmt(stmt) {
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function parseJson(raw, fallback = null) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getMeta(key) {
  if (!db) return null;
  const stmt = db.prepare('SELECT value FROM meta WHERE key = ?');
  stmt.bind([key]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row?.value ?? null;
}

function setMeta(key, value) {
  db.run(
    'INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, String(value ?? '')],
  );
  persistDb();
}

function ensureDeviceId() {
  let id = getMeta('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    setMeta('deviceId', id);
  }
  return id;
}

async function getDb() {
  if (db) return db;
  const SQL = await withDbTimeout(loadSql(), 'sql.js load');
  const file = dbFilePath();
  if (fs.existsSync(file)) {
    db = new SQL.Database(fs.readFileSync(file));
  } else {
    db = new SQL.Database();
  }
  db.run(SCHEMA);
  ensureDeviceId();
  persistDb();
  return db;
}

module.exports = {
  getDb,
  persistDb,
  rowsFromStmt,
  parseJson,
  getMeta,
  setMeta,
  ensureDeviceId,
};
