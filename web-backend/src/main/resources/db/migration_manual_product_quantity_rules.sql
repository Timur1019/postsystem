-- Правила количества на товаре: unit_code, quantity_scale, allow_fraction.
-- psql "$DB_URL" -f web-backend/src/main/resources/db/migration_manual_product_quantity_rules.sql

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS unit_code VARCHAR(10) NOT NULL DEFAULT 'PCS';

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS quantity_scale INT NOT NULL DEFAULT 0;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS allow_fraction BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE products
SET unit_code = CASE
        WHEN sale_type = 'WEIGHT' THEN 'KG'
        ELSE 'PCS'
    END,
    quantity_scale = CASE
        WHEN sale_type = 'WEIGHT' THEN 3
        ELSE 0
    END,
    allow_fraction = CASE
        WHEN sale_type = 'WEIGHT' THEN TRUE
        ELSE FALSE
    END
WHERE unit_code IS NULL
   OR unit_code = ''
   OR quantity_scale IS NULL
   OR allow_fraction IS NULL;

UPDATE products
SET unit_code = 'KG'
WHERE sale_type = 'WEIGHT'
  AND LOWER(TRIM(COALESCE(unit_of_measure, ''))) IN ('kg', 'кг')
  AND unit_code = 'PCS';
