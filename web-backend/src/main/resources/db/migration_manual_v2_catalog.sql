-- Run once against an existing DB (before Hibernate validate).
-- PostgreSQL 11+

CREATE TABLE IF NOT EXISTS stores (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    code        VARCHAR(50),
    is_active   BOOLEAN DEFAULT TRUE
);

INSERT INTO stores (name, code, is_active)
SELECT 'Main store', 'MAIN', TRUE
WHERE NOT EXISTS (SELECT 1 FROM stores LIMIT 1);

ALTER TABLE products ADD COLUMN IF NOT EXISTS external_product_id VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS ikpu VARCHAR(32);
ALTER TABLE products ADD COLUMN IF NOT EXISTS ikpu_status VARCHAR(30) DEFAULT 'UNKNOWN';
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_measure_code VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_code VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_individually BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS marked_product BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_type VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_tin VARCHAR(9);
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_pinfl VARCHAR(14);

CREATE TABLE IF NOT EXISTS product_barcodes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode     VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS product_store_prices (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id    INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    price       NUMERIC(12, 2) NOT NULL,
    UNIQUE (product_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_products_ikpu ON products(ikpu);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_bc ON product_barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_psp_product ON product_store_prices(product_id);
