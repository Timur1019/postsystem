-- Скидки в сохранённом Z-отчёте (сумма по смене).
-- psql "$DATABASE_URL" -f web-backend/src/main/resources/db/migration_manual_z_report_discount.sql

ALTER TABLE z_reports
    ADD COLUMN IF NOT EXISTS discount_total NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS line_discount_total NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS order_discount_total NUMERIC(18, 2) DEFAULT 0;
