-- Offline POS sync: idempotent client sale id + source marker.
-- Apply manually on existing DBs; mirrored in schema.sql for fresh installs.

ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_sale_id UUID UNIQUE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS offline_device_id VARCHAR(64);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_source VARCHAR(20) NOT NULL DEFAULT 'ONLINE';

CREATE INDEX IF NOT EXISTS idx_sales_client_sale_id ON sales(client_sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_source ON sales(sale_source);
