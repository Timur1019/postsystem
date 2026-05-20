-- Номер электронного счёт-фактуры Узбекистан (Didox/Soliq) для связки строк импорта с уже созданными позициями.
ALTER TABLE products ADD COLUMN IF NOT EXISTS uz_invoice_document_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_products_uz_invoice_ikpu
    ON products (uz_invoice_document_id, ikpu)
    WHERE is_active = TRUE AND uz_invoice_document_id IS NOT NULL AND ikpu IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_uz_invoice_sku
    ON products (uz_invoice_document_id, sku)
    WHERE is_active = TRUE AND uz_invoice_document_id IS NOT NULL;
