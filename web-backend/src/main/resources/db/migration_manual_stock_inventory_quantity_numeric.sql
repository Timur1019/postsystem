-- Инвентаризация: total_difference / difference → NUMERIC(18,3) (Hibernate validate).
-- Нужно, если migration_manual_sale_type_decimal_quantity.sql уже применялась без этих колонок.
-- psql "$DB_URL" -f web-backend/src/main/resources/db/migration_manual_stock_inventory_quantity_numeric.sql

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_inventories') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'stock_inventories'
              AND column_name = 'total_difference'
              AND data_type <> 'numeric'
        ) THEN
            ALTER TABLE stock_inventories
                ALTER COLUMN total_difference TYPE NUMERIC(18, 3)
                USING ROUND(COALESCE(total_difference, 0)::numeric, 3);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_inventory_lines') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'stock_inventory_lines'
              AND column_name = 'difference'
              AND data_type <> 'numeric'
        ) THEN
            ALTER TABLE stock_inventory_lines
                ALTER COLUMN difference TYPE NUMERIC(18, 3)
                USING ROUND(COALESCE(difference, 0)::numeric, 3);
        END IF;
    END IF;
END $$;
