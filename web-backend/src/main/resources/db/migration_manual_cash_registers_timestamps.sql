-- Даты создания/редактирования для касс (модалка «Детали»).
ALTER TABLE cash_registers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cash_registers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE cash_registers
SET
    created_at = COALESCE(created_at, '2024-01-12 06:49:00+05'::timestamptz),
    updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;
