-- Тип продажи (PIECE / WEIGHT / SERVICE) и количество DECIMAL(18,3) везде.
-- psql "$DB_URL" -f web-backend/src/main/resources/db/migration_manual_sale_type_decimal_quantity.sql

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) NOT NULL DEFAULT 'PIECE';

UPDATE products SET sale_type = 'PIECE' WHERE sale_type IS NULL OR TRIM(sale_type) = '';

ALTER TABLE products
    ALTER COLUMN stock_quantity TYPE NUMERIC(18, 3)
    USING ROUND(COALESCE(stock_quantity, 0)::numeric, 3);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_stock') THEN
        ALTER TABLE store_stock
            ALTER COLUMN quantity TYPE NUMERIC(18, 3)
            USING ROUND(COALESCE(quantity, 0)::numeric, 3);
    END IF;
END $$;

ALTER TABLE sale_items
    ALTER COLUMN quantity TYPE NUMERIC(18, 3)
    USING ROUND(COALESCE(quantity, 0)::numeric, 3);

ALTER TABLE sale_items
    ALTER COLUMN returned_quantity TYPE NUMERIC(18, 3)
    USING ROUND(COALESCE(returned_quantity, 0)::numeric, 3);

ALTER TABLE stock_movements
    ALTER COLUMN quantity TYPE NUMERIC(18, 3)
    USING ROUND(COALESCE(quantity, 0)::numeric, 3);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_receipt_lines') THEN
        ALTER TABLE stock_receipt_lines
            ALTER COLUMN quantity TYPE NUMERIC(18, 3)
            USING ROUND(COALESCE(quantity, 0)::numeric, 3);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_transfer_lines') THEN
        ALTER TABLE stock_transfer_lines
            ALTER COLUMN quantity TYPE NUMERIC(18, 3)
            USING ROUND(COALESCE(quantity, 0)::numeric, 3);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_transfers') THEN
        ALTER TABLE stock_transfers
            ALTER COLUMN total_quantity TYPE NUMERIC(18, 3)
            USING ROUND(COALESCE(total_quantity, 0)::numeric, 3);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_receipts') THEN
        ALTER TABLE stock_receipts
            ALTER COLUMN total_quantity TYPE NUMERIC(18, 3)
            USING ROUND(COALESCE(total_quantity, 0)::numeric, 3);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_inventories') THEN
        ALTER TABLE stock_inventories
            ALTER COLUMN total_difference TYPE NUMERIC(18, 3)
            USING ROUND(COALESCE(total_difference, 0)::numeric, 3);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_inventory_lines') THEN
        ALTER TABLE stock_inventory_lines
            ALTER COLUMN system_quantity TYPE NUMERIC(18, 3)
            USING ROUND(COALESCE(system_quantity, 0)::numeric, 3);
        ALTER TABLE stock_inventory_lines
            ALTER COLUMN counted_quantity TYPE NUMERIC(18, 3)
            USING ROUND(COALESCE(counted_quantity, 0)::numeric, 3);
        ALTER TABLE stock_inventory_lines
            ALTER COLUMN difference TYPE NUMERIC(18, 3)
            USING ROUND(COALESCE(difference, 0)::numeric, 3);
    END IF;
END $$;
