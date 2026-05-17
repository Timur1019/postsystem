-- ============================================================
--  POS Desktop - SQLite Schema
--  Lightweight, offline-capable
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,           -- UUID as text
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,              -- bcrypt hash
    full_name   TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'CASHIER', -- ADMIN, CASHIER
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT UNIQUE NOT NULL
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id              TEXT PRIMARY KEY,
    sku             TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    category_id     INTEGER REFERENCES categories(id),
    cost_price      REAL NOT NULL DEFAULT 0,
    selling_price   REAL NOT NULL,
    tax_rate        REAL NOT NULL DEFAULT 0,
    stock_quantity  INTEGER NOT NULL DEFAULT 0,
    low_stock_alert INTEGER NOT NULL DEFAULT 10,
    barcode         TEXT UNIQUE,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
    id              TEXT PRIMARY KEY,
    receipt_number  TEXT UNIQUE NOT NULL,
    cashier_id      TEXT NOT NULL REFERENCES users(id),
    subtotal        REAL NOT NULL,
    tax_total       REAL NOT NULL DEFAULT 0,
    discount_total  REAL NOT NULL DEFAULT 0,
    total_amount    REAL NOT NULL,
    payment_method  TEXT NOT NULL,          -- CASH, CARD, MPESA
    amount_tendered REAL,
    change_given    REAL DEFAULT 0,
    status          TEXT DEFAULT 'COMPLETED', -- COMPLETED, VOIDED
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sale_items (
    id            TEXT PRIMARY KEY,
    sale_id       TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id    TEXT NOT NULL REFERENCES products(id),
    product_name  TEXT NOT NULL,
    unit_price    REAL NOT NULL,
    quantity      INTEGER NOT NULL,
    discount      REAL DEFAULT 0,
    tax_amount    REAL DEFAULT 0,
    line_total    REAL NOT NULL
);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id            TEXT PRIMARY KEY,
    product_id    TEXT NOT NULL REFERENCES products(id),
    movement_type TEXT NOT NULL,            -- SALE, RESTOCK, ADJUSTMENT, RETURN
    quantity      INTEGER NOT NULL,
    reference_id  TEXT,
    notes         TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SYNC LOG (for future cloud sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id   TEXT NOT NULL,
    action      TEXT NOT NULL,             -- INSERT, UPDATE, DELETE
    synced      INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_sku     ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_date       ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale  ON sale_items(sale_id);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT OR IGNORE INTO categories (name) VALUES ('General'), ('Food & Beverage'), ('Electronics');

-- Default admin user: admin / admin123 (bcrypt)
INSERT OR IGNORE INTO users (id, username, password, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2a$10$MKT30xj4dEuM5AI/oJhmN.pI9mPRE/BL/npcgranPoR9dXTl3WQ7.',
    'System Administrator',
    'ADMIN'
);

