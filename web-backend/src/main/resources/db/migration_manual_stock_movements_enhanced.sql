-- store_id on movements (nullable); write-off reason
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS write_off_reason VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type_created ON stock_movements(movement_type, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_store ON stock_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created ON stock_movements(product_id, created_at);
