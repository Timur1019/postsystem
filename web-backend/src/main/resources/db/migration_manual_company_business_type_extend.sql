-- Расширение списка типов бизнеса: одежда, аптека, автозапчасти; убран legacy RETAIL.
-- Применяется через deploy/migrate-db.sh (см. deploy/migrations-prod.txt).

UPDATE companies
SET business_type = 'UNIVERSAL'
WHERE business_type = 'RETAIL';

COMMENT ON COLUMN companies.business_type IS
    'CONSTRUCTION | GROCERY | CLOTHING | PHARMACY | CANTEEN | RESTAURANT | AUTO_PARTS | UNIVERSAL';
