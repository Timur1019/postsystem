-- Привязка продажи к магазину (касса продавца).
ALTER TABLE sales ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
