-- Ускорение ночной пересборки кеша отчётов (COMPLETED + created_at)
CREATE INDEX IF NOT EXISTS idx_sales_completed_created ON sales(created_at) WHERE status = 'COMPLETED';
