-- Z-период внутри открытой смены: после Z счётчики с period_started_at
ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS period_started_at TIMESTAMPTZ;
UPDATE cashier_shifts SET period_started_at = opened_at WHERE period_started_at IS NULL;
