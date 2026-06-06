-- Вертикаль товара + таблицы расширений (Class Table Inheritance).
-- psql "$DB_URL" -f web-backend/src/main/resources/db/migration_manual_product_type_extensions.sql

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS product_type VARCHAR(30) NOT NULL DEFAULT 'RETAIL';

CREATE TABLE IF NOT EXISTS retail_product_details (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    marked_product BOOLEAN NOT NULL DEFAULT FALSE,
    sold_individually BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS construction_product_details (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    standard_length NUMERIC(10, 2),
    width NUMERIC(10, 2),
    thickness NUMERIC(10, 2),
    allow_cutting BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS restaurant_product_details (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    preparation_time_minutes INT,
    kitchen_department VARCHAR(50),
    is_combo_component BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS service_product_details (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    duration_minutes INT,
    requires_appointment BOOLEAN NOT NULL DEFAULT FALSE
);

-- Миграция розничных флагов в extension (dual-read: колонки products пока остаются).
INSERT INTO retail_product_details (product_id, marked_product, sold_individually)
SELECT id, marked_product, sold_individually
FROM products
ON CONFLICT (product_id) DO UPDATE
SET marked_product = EXCLUDED.marked_product,
    sold_individually = EXCLUDED.sold_individually;

-- Услуги: product_type по sale_type.
UPDATE products
SET product_type = 'SERVICE'
WHERE sale_type = 'SERVICE'
  AND product_type = 'RETAIL';
