-- Поля одежды и аптеки в retail_product_details.
-- deploy/migrate-db.sh + docker-entrypoint-initdb.d/35-retail_vertical_fields.sql

ALTER TABLE retail_product_details
    ADD COLUMN IF NOT EXISTS clothing_size_range VARCHAR(80),
    ADD COLUMN IF NOT EXISTS clothing_color VARCHAR(50),
    ADD COLUMN IF NOT EXISTS clothing_gender VARCHAR(20),
    ADD COLUMN IF NOT EXISTS pharmacy_expiry_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pharmacy_prescription_required BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pharmacy_dosage_form VARCHAR(100);

COMMENT ON COLUMN retail_product_details.clothing_size_range IS 'Диапазон размеров: S-XXL, 38-44';
COMMENT ON COLUMN retail_product_details.pharmacy_dosage_form IS 'Форма выпуска: таблетки, сироп, мазь';
