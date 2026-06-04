-- Привести все колонки количества к NUMERIC(18,3) + поля products для весового товара.
-- Для production, если backend падает на Schema-validation (ddl-auto=validate).
-- psql ... -f migration_manual_fix_all_quantity_numeric.sql

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) NOT NULL DEFAULT 'PIECE';

UPDATE products SET sale_type = 'PIECE' WHERE sale_type IS NULL OR TRIM(sale_type) = '';

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS unit_code VARCHAR(10) NOT NULL DEFAULT 'PCS';

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS quantity_scale INT NOT NULL DEFAULT 0;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS allow_fraction BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE products
SET unit_code = CASE WHEN sale_type = 'WEIGHT' THEN 'KG' ELSE 'PCS' END,
    quantity_scale = CASE WHEN sale_type = 'WEIGHT' THEN 3 ELSE 0 END,
    allow_fraction = CASE WHEN sale_type = 'WEIGHT' THEN TRUE ELSE FALSE END
WHERE unit_code IS NULL OR unit_code = '';

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT *
        FROM (VALUES
            ('products', 'stock_quantity'),
            ('store_stock', 'quantity'),
            ('sale_items', 'quantity'),
            ('sale_items', 'returned_quantity'),
            ('stock_movements', 'quantity'),
            ('stock_receipt_lines', 'quantity'),
            ('stock_transfer_lines', 'quantity'),
            ('stock_transfers', 'total_quantity'),
            ('stock_receipts', 'total_quantity'),
            ('stock_inventories', 'total_difference'),
            ('stock_inventory_lines', 'system_quantity'),
            ('stock_inventory_lines', 'counted_quantity'),
            ('stock_inventory_lines', 'difference')
        ) AS t(table_name, column_name)
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = r.table_name
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = r.table_name
              AND column_name = r.column_name
              AND data_type <> 'numeric'
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I ALTER COLUMN %I TYPE NUMERIC(18, 3) USING ROUND(COALESCE(%I, 0)::numeric, 3)',
                r.table_name, r.column_name, r.column_name
            );
            RAISE NOTICE 'Converted %.% to NUMERIC(18,3)', r.table_name, r.column_name;
        END IF;
    END LOOP;
END $$;
