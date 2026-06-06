-- Шаблон каталога на товаре (product templates v1).
-- deploy/migrate-db.sh + docker-entrypoint-initdb.d/34-product_template_code.sql

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS template_code VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_products_template_code
    ON products (template_code)
    WHERE template_code IS NOT NULL;

COMMENT ON COLUMN products.template_code IS
    'BULK | LENGTH | MM_LENGTH | LIQUID | PIECE_CONSTRUCTION | WEIGHT_GROCERY | PIECE_GROCERY | BEVERAGE | FROZEN | PIECE_RETAIL | DISH | SERVICE';
