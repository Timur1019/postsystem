-- Скидка по умолчанию для кассы (%)
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0;
