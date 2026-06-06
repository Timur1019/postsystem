-- Разбивка оплаты в Z-отчёте: Humo, Uzcard, безналичная (QR).
-- psql "$DATABASE_URL" -f web-backend/src/main/resources/db/migration_manual_z_report_payment_breakdown.sql

ALTER TABLE z_reports
    ADD COLUMN IF NOT EXISTS humo_total NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS uzcard_total NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cashless_total NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS returns_humo NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS returns_uzcard NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS returns_cashless NUMERIC(18, 2) DEFAULT 0;
