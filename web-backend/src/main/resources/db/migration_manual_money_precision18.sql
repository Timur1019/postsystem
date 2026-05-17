-- Widen money columns for high-denomination currencies (e.g. UZS).
-- Run manually against pos_db when upgrading (JPA ddl-auto=validate).

ALTER TABLE products
    ALTER COLUMN cost_price TYPE NUMERIC(18, 2),
    ALTER COLUMN selling_price TYPE NUMERIC(18, 2);

ALTER TABLE product_store_prices
    ALTER COLUMN price TYPE NUMERIC(18, 2);

ALTER TABLE sales
    ALTER COLUMN subtotal TYPE NUMERIC(18, 2),
    ALTER COLUMN tax_total TYPE NUMERIC(18, 2),
    ALTER COLUMN discount_total TYPE NUMERIC(18, 2),
    ALTER COLUMN total_amount TYPE NUMERIC(18, 2),
    ALTER COLUMN amount_tendered TYPE NUMERIC(18, 2),
    ALTER COLUMN change_given TYPE NUMERIC(18, 2);

ALTER TABLE sale_items
    ALTER COLUMN unit_price TYPE NUMERIC(18, 2),
    ALTER COLUMN discount TYPE NUMERIC(18, 2),
    ALTER COLUMN tax_amount TYPE NUMERIC(18, 2),
    ALTER COLUMN line_total TYPE NUMERIC(18, 2);
