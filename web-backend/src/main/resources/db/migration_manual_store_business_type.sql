-- Тип бизнеса магазина (определяет поля при добавлении товара).
ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS business_type VARCHAR(32) NOT NULL DEFAULT 'UNIVERSAL';

UPDATE stores s
SET business_type = COALESCE(c.business_type, 'UNIVERSAL')
FROM companies c
WHERE s.company_id = c.id
  AND s.business_type = 'UNIVERSAL';

COMMENT ON COLUMN stores.business_type IS
    'CONSTRUCTION | GROCERY | CLOTHING | PHARMACY | CANTEEN | RESTAURANT | AUTO_PARTS | UNIVERSAL | OTHER';
