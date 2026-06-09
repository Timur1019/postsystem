const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  name TEXT NOT NULL,
  selling_price REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 12,
  barcode TEXT,
  category_id INTEGER,
  sale_type TEXT,
  unit_code TEXT,
  quantity_scale INTEGER DEFAULT 0,
  allow_fraction INTEGER DEFAULT 0,
  stock_quantity REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_barcodes (
  barcode TEXT PRIMARY KEY,
  product_id TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS local_shifts (
  client_shift_id TEXT PRIMARY KEY,
  server_shift_id TEXT,
  store_id INTEGER NOT NULL,
  cashier_id TEXT NOT NULL,
  cashier_name TEXT,
  store_name TEXT,
  opened_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  sale_count INTEGER NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  cash_amount REAL NOT NULL DEFAULT 0,
  card_amount REAL NOT NULL DEFAULT 0,
  vat_amount REAL NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE IF NOT EXISTS local_sales (
  client_sale_id TEXT PRIMARY KEY,
  client_shift_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  response_json TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  server_sale_id TEXT,
  server_receipt_number TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_sales_sync ON local_sales(sync_status);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
`;

module.exports = { SCHEMA };
