-- Скидка на чек: отдельные поля в sales (позиции + скидка на весь чек).
-- Применяется через deploy/migrate-db.sh (см. deploy/migrations-prod.txt).

ALTER TABLE sales ADD COLUMN IF NOT EXISTS line_discount_total NUMERIC(18, 2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_discount_amount NUMERIC(18, 2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_discount_percent NUMERIC(5, 2);

COMMENT ON COLUMN sales.line_discount_total IS 'Сумма скидок по позициям';
COMMENT ON COLUMN sales.order_discount_amount IS 'Скидка на весь чек (сумма)';
COMMENT ON COLUMN sales.order_discount_percent IS 'Скидка на чек (процент на момент продажи)';

-- Исторические чеки: вся скидка считалась только в discount_total по строкам
UPDATE sales
SET line_discount_total = discount_total,
    order_discount_amount = 0,
    order_discount_percent = NULL
WHERE line_discount_total = 0 AND order_discount_amount = 0;
