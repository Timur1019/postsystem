-- Штрихкоды доп. полей: уникальность в рамках компании (не глобально).
ALTER TABLE product_barcodes ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE CASCADE;

UPDATE product_barcodes pb
SET company_id = p.company_id
FROM products p
WHERE pb.product_id = p.id AND pb.company_id IS NULL;

ALTER TABLE product_barcodes DROP CONSTRAINT IF EXISTS product_barcodes_barcode_key;
DROP INDEX IF EXISTS uq_product_barcodes_company_barcode;
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_barcodes_company_barcode
    ON product_barcodes (company_id, barcode)
    WHERE company_id IS NOT NULL;
