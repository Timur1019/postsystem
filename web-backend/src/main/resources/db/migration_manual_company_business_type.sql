-- Тип бизнеса компании (шаблоны товаров v1).
-- Применяется через deploy/migrate-db.sh (см. deploy/migrations-prod.txt)
-- и docker-entrypoint-initdb.d/31-company_business_type.sql.

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS business_type VARCHAR(32) NOT NULL DEFAULT 'UNIVERSAL';

COMMENT ON COLUMN companies.business_type IS
    'CONSTRUCTION | GROCERY | CLOTHING | PHARMACY | CANTEEN | RESTAURANT | AUTO_PARTS | UNIVERSAL';
