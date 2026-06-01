-- ============================================================
--  POS SYSTEM - PostgreSQL Schema
--  Clean, normalized, production-ready
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS & ROLES
-- ============================================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,  -- ADMIN, CASHIER, MANAGER
    description TEXT
);

CREATE TABLE companies (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    login_code   VARCHAR(32) NOT NULL,
    legal_name   VARCHAR(255),
    tin          VARCHAR(20),
    address      TEXT,
    phone        VARCHAR(50),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_companies_login_code ON companies (LOWER(login_code));

CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username     VARCHAR(100) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    password     VARCHAR(255) NOT NULL,
    full_name    VARCHAR(255) NOT NULL,
    first_name   VARCHAR(100),
    last_name    VARCHAR(100),
    patronymic   VARCHAR(100),
    role_id      INT NOT NULL REFERENCES roles(id),
    company_id   INT REFERENCES companies(id) ON DELETE SET NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_users_tenant_username ON users (LOWER(username))
  WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_users_company_email ON users (company_id, LOWER(email))
  WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX uq_users_platform_username ON users (LOWER(username))
  WHERE company_id IS NULL;
CREATE UNIQUE INDEX uq_users_platform_email ON users (LOWER(email))
  WHERE company_id IS NULL;

-- ============================================================
-- PRODUCTS & INVENTORY
-- ============================================================
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku                 VARCHAR(100) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    category_id         INT REFERENCES categories(id) ON DELETE SET NULL,
    cost_price          NUMERIC(18, 2) NOT NULL DEFAULT 0,
    selling_price       NUMERIC(18, 2) NOT NULL,
    default_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_rate            NUMERIC(5, 2) DEFAULT 0,
    stock_quantity      INT NOT NULL DEFAULT 0,
    low_stock_alert     INT DEFAULT 10,
    barcode             VARCHAR(100) UNIQUE,
    image_url           VARCHAR(500),
    is_active           BOOLEAN DEFAULT TRUE,
    external_product_id VARCHAR(100),
    ikpu                VARCHAR(32),
    ikpu_status         VARCHAR(30) DEFAULT 'UNKNOWN',
    unit_of_measure     VARCHAR(50),
    unit_measure_code   VARCHAR(20),
    package_code        VARCHAR(20),
    sold_individually   BOOLEAN DEFAULT TRUE,
    marked_product      BOOLEAN DEFAULT FALSE,
    storage_location    VARCHAR(255),
    owner_type          VARCHAR(50),
    commission_tin      VARCHAR(9),
    commission_pinfl    VARCHAR(14),
    uz_invoice_document_id VARCHAR(64),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stores (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    code        VARCHAR(50),
    address     TEXT,
    phone       VARCHAR(50),
    company_id  INT REFERENCES companies(id) ON DELETE SET NULL,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_stores (
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id  INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, store_id)
);

CREATE TABLE cash_registers (
    id                  BIGSERIAL PRIMARY KEY,
    store_id            INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    register_number     INT NOT NULL DEFAULT 1,
    equipment_model     VARCHAR(100),
    equipment_serial    VARCHAR(100),
    fiscal_card_id      VARCHAR(100),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (store_id, register_number)
);

CREATE INDEX idx_cash_registers_store ON cash_registers(store_id);

-- ============================================================
-- CASH REGISTER CONFIGURATIONS (номенклатура / магазины / SN касс)
-- ============================================================
CREATE TABLE cash_register_configs (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(200) NOT NULL UNIQUE,
    locked_default   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cash_register_config_stores (
    config_id  BIGINT NOT NULL REFERENCES cash_register_configs(id) ON DELETE CASCADE,
    store_id   INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    PRIMARY KEY (config_id, store_id)
);

CREATE TABLE cash_register_config_registers (
    config_id         BIGINT NOT NULL REFERENCES cash_register_configs(id) ON DELETE CASCADE,
    cash_register_id  BIGINT NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
    PRIMARY KEY (config_id, cash_register_id)
);

CREATE TABLE cash_register_config_categories (
    config_id    BIGINT NOT NULL REFERENCES cash_register_configs(id) ON DELETE CASCADE,
    category_id  INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (config_id, category_id)
);

CREATE INDEX idx_crcfg_stores_config ON cash_register_config_stores(config_id);
CREATE INDEX idx_crcfg_registers_config ON cash_register_config_registers(config_id);
CREATE INDEX idx_crcfg_categories_config ON cash_register_config_categories(config_id);

CREATE TABLE z_reports (
    id                      BIGSERIAL PRIMARY KEY,
    store_id                INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    fiscal_card_id          VARCHAR(100) NOT NULL,
    terminal_serial         VARCHAR(100),
    opened_at               TIMESTAMPTZ NOT NULL,
    closed_at               TIMESTAMPTZ NOT NULL,
    z_number                INT NOT NULL,
    total_amount            NUMERIC(18, 2) NOT NULL,
    vat_amount              NUMERIC(18, 2) NOT NULL,
    employee_name           VARCHAR(255) NOT NULL,
    brand_name              VARCHAR(200),
    company_name            VARCHAR(255),
    company_address         TEXT,
    tin                     VARCHAR(32),
    applet_version          VARCHAR(32),
    cash_total              NUMERIC(18, 2) DEFAULT 0,
    card_total              NUMERIC(18, 2) DEFAULT 0,
    returns_cash            NUMERIC(18, 2) DEFAULT 0,
    returns_card            NUMERIC(18, 2) DEFAULT 0,
    vat_return              NUMERIC(18, 2) DEFAULT 0,
    sales_count             INT DEFAULT 0,
    returns_count           INT DEFAULT 0,
    first_receipt_number    VARCHAR(50),
    last_receipt_number     VARCHAR(50),
    discount_total          NUMERIC(18, 2) DEFAULT 0,
    line_discount_total     NUMERIC(18, 2) DEFAULT 0,
    order_discount_total    NUMERIC(18, 2) DEFAULT 0,
    UNIQUE (store_id, z_number)
);

CREATE INDEX idx_z_reports_store ON z_reports(store_id);
CREATE INDEX idx_z_reports_closed_at ON z_reports(closed_at);

-- Customer / delivery orders (UI «Заказы»)
-- Уже есть БД без этих таблиц: см. db/migration_manual_customer_orders.sql (CREATE IF NOT EXISTS).
CREATE TABLE customer_orders (
    id                 BIGSERIAL PRIMARY KEY,
    store_id           INT NOT NULL REFERENCES stores(id),
    external_number    VARCHAR(100),
    status             VARCHAR(30) NOT NULL DEFAULT 'NEW',
    client_name        VARCHAR(255),
    client_phone       VARCHAR(40),
    delivery_address   TEXT,
    comment            TEXT,
    courier_id         UUID REFERENCES users(id),
    payment_method     VARCHAR(20),
    receipt_number     VARCHAR(50),
    receipt_at         TIMESTAMPTZ,
    total_amount       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    created_by         UUID NOT NULL REFERENCES users(id),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_orders_store ON customer_orders(store_id);
CREATE INDEX idx_customer_orders_created ON customer_orders(created_at);
CREATE INDEX idx_customer_orders_status ON customer_orders(status);

CREATE TABLE customer_order_photos (
    id            BIGSERIAL PRIMARY KEY,
    order_id      BIGINT NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
    slot          INT NOT NULL CHECK (slot >= 1 AND slot <= 5),
    file_name     VARCHAR(255) NOT NULL,
    content_type  VARCHAR(120) NOT NULL,
    UNIQUE (order_id, slot)
);

CREATE INDEX idx_customer_order_photos_order ON customer_order_photos(order_id);

CREATE TABLE product_barcodes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode     VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE product_store_prices (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id    INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    price       NUMERIC(18, 2) NOT NULL,
    UNIQUE (product_id, store_id)
);

CREATE TABLE stock_movements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id),
    movement_type   VARCHAR(20) NOT NULL,  -- SALE, RESTOCK, ADJUSTMENT, RETURN
    quantity        INT NOT NULL,           -- negative for reductions
    reference_id    UUID,                  -- sale_id or purchase_id
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE suppliers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    tax_id      VARCHAR(32)  NOT NULL,
    address     VARCHAR(500),
    email       VARCHAR(255),
    phone       VARCHAR(40),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tax_id)
);

-- ============================================================
-- CUSTOMERS (Optional but good for loyalty)
-- ============================================================
CREATE TABLE customers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(255) NOT NULL,
    phone        VARCHAR(20) UNIQUE,
    email        VARCHAR(255) UNIQUE,
    loyalty_pts  INT DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CASHIER SHIFTS
-- ============================================================
CREATE TABLE cashier_shifts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id      UUID NOT NULL REFERENCES users(id),
    store_id        INT NOT NULL REFERENCES stores(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    period_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,
    sale_count      INT NOT NULL DEFAULT 0,
    total_amount    NUMERIC(18, 2) NOT NULL DEFAULT 0,
    cash_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    card_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    vat_amount      NUMERIC(18, 2) NOT NULL DEFAULT 0,
    z_report_id     BIGINT REFERENCES z_reports(id)
);

CREATE INDEX idx_cashier_shifts_cashier_status ON cashier_shifts(cashier_id, status);
CREATE INDEX idx_cashier_shifts_store_opened ON cashier_shifts(store_id, opened_at);

-- ============================================================
-- SALES & TRANSACTIONS
-- ============================================================
CREATE TABLE sales (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number  VARCHAR(50) UNIQUE NOT NULL,
    cashier_id      UUID NOT NULL REFERENCES users(id),
    store_id        INT REFERENCES stores(id) ON DELETE SET NULL,
    customer_id     UUID REFERENCES customers(id),
    subtotal        NUMERIC(18, 2) NOT NULL,
    tax_total       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    discount_total  NUMERIC(18, 2) NOT NULL DEFAULT 0,
    line_discount_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
    order_discount_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    order_discount_percent NUMERIC(5, 2),
    total_amount    NUMERIC(18, 2) NOT NULL,
    payment_method  VARCHAR(20) NOT NULL,  -- CASH, CARD, MPESA, MIXED
    receipt_type    VARCHAR(20) DEFAULT 'SALE',
    card_type       VARCHAR(20),
    cashier_shift_id UUID REFERENCES cashier_shifts(id),
    cash_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    card_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    amount_tendered NUMERIC(18, 2),
    change_given    NUMERIC(18, 2) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'COMPLETED', -- COMPLETED, REFUNDED, VOIDED
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sale_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    product_name    VARCHAR(255) NOT NULL,  -- snapshot at time of sale
    unit_price      NUMERIC(18, 2) NOT NULL,
    quantity        INT NOT NULL,
    returned_quantity INT NOT NULL DEFAULT 0,
    discount        NUMERIC(18, 2) DEFAULT 0,
    tax_amount      NUMERIC(18, 2) DEFAULT 0,
    line_total      NUMERIC(18, 2) NOT NULL
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID REFERENCES users(id),
    action       VARCHAR(100) NOT NULL,  -- LOGIN, PRODUCT_CREATE, SALE_VOID, etc.
    entity_type  VARCHAR(100),
    entity_id    VARCHAR(255),
    old_value    JSONB,
    new_value    JSONB,
    ip_address   VARCHAR(45),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_products_sku        ON products(sku);
CREATE INDEX idx_products_barcode    ON products(barcode);
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_ikpu       ON products(ikpu);
CREATE INDEX idx_product_barcodes_bc ON product_barcodes(barcode);
CREATE INDEX idx_psp_product         ON product_store_prices(product_id);
CREATE INDEX idx_sales_cashier       ON sales(cashier_id);
CREATE INDEX idx_sales_store         ON sales(store_id);
CREATE INDEX idx_sales_cashier_shift ON sales(cashier_shift_id);
CREATE INDEX idx_sales_created_at    ON sales(created_at);
CREATE INDEX idx_sales_completed_created ON sales(created_at) WHERE status = 'COMPLETED';
CREATE INDEX idx_sale_items_sale     ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product  ON sale_items(product_id);
CREATE INDEX idx_stock_product       ON stock_movements(product_id);
CREATE INDEX idx_audit_user          ON audit_logs(user_id);
CREATE INDEX idx_audit_created       ON audit_logs(created_at);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO roles (name, description) VALUES
    ('SUPER_ADMIN', 'Platform operator'),
    ('ADMIN',    'Full system access'),
    ('MANAGER',  'Reports + inventory management'),
    ('CASHIER',  'Sales and basic operations');

INSERT INTO categories (name, description) VALUES
    ('Electronics',   'Electronic devices and accessories'),
    ('Food & Beverage', 'Consumables and groceries'),
    ('Clothing',      'Apparel and fashion'),
    ('Stationery',    'Office and school supplies');

INSERT INTO companies (name, login_code, legal_name, address, is_active) VALUES
    ('MIRONKUL AGRO GLOBAL', 'MIRONKULAGROGLOBAL', 'MIRONKUL AGRO GLOBAL',
     'Samarqand vil., Samarqan tuman., O''rtashiq MSG., Mardi Maydon ko''chasi 403 uy', TRUE);

INSERT INTO stores (name, code, address, company_id, is_active) VALUES
    ('MIRONKUL AGRO GLOBAL', 'MAIN',
     'Samarqand vil., Samarqan tuman., O''rtashiq MSG., Mardi Maydon ko''chasi 403 uy', 1, TRUE);

INSERT INTO cash_registers (store_id, register_number, equipment_model, equipment_serial, fiscal_card_id, status)
SELECT 1, 1, 'A930', '1171615664', 'UZ210317231786', 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM stores WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM cash_registers WHERE store_id = 1 AND register_number = 1);

INSERT INTO cash_registers (store_id, register_number, equipment_model, equipment_serial, fiscal_card_id, status)
SELECT 1, 2, 'A930', '1171615999', 'UZ210317231799', 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM stores WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM cash_registers WHERE store_id = 1 AND register_number = 2);

-- Z-отчёты строятся из продаж: db/migration_manual_z_reports_from_sales.sql

-- Default admin user: username `admin`, password `password`
INSERT INTO users (username, email, password, full_name, first_name, last_name, role_id, company_id)
SELECT 'admin', 'admin@store.com',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       'Administrator', 'Administrator', 'Admin', r.id, 1
FROM roles r WHERE r.name = 'ADMIN'
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.username = 'admin');

INSERT INTO user_stores (user_id, store_id)
SELECT u.id, 1 FROM users u WHERE u.username = 'admin'
AND NOT EXISTS (SELECT 1 FROM user_stores us WHERE us.user_id = u.id AND us.store_id = 1);

-- Demo cashier: username `kassir`, password `password`
INSERT INTO users (username, email, password, full_name, first_name, last_name, role_id, company_id)
SELECT 'kassir', 'kassir@store.com',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       'Кассир', 'Кассир', 'Демо', r.id, 1
FROM roles r WHERE r.name = 'CASHIER'
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.username = 'kassir');

INSERT INTO user_stores (user_id, store_id)
SELECT u.id, 1 FROM users u WHERE u.username = 'kassir'
AND NOT EXISTS (SELECT 1 FROM user_stores us WHERE us.user_id = u.id AND us.store_id = 1);

INSERT INTO users (username, email, password, full_name, first_name, last_name, role_id)
SELECT 'superadmin', 'superadmin@platform.local',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       'Super Administrator', 'Super', 'Administrator', r.id
FROM roles r WHERE r.name = 'SUPER_ADMIN'
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.username = 'superadmin');

INSERT INTO cash_register_configs (name, locked_default)
SELECT 'Конфигурация по умолчанию', TRUE
WHERE NOT EXISTS (SELECT 1 FROM cash_register_configs WHERE locked_default = TRUE);
