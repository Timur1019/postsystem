-- Cashier PIN login (multi-tenant).
-- Adds deterministic PIN digest to users for fast lookup + uniqueness within company.
-- psql ... -f migration_manual_cashier_pin_login.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_digest VARCHAR(64);

-- Index for PIN login lookup (company_id + pin_digest)
CREATE INDEX IF NOT EXISTS ix_users_company_pin_digest
  ON users (company_id, pin_digest)
  WHERE company_id IS NOT NULL AND pin_digest IS NOT NULL;

-- PIN must be unique within a company (only for accounts that have PIN configured)
DROP INDEX IF EXISTS uq_users_company_pin_digest;
CREATE UNIQUE INDEX uq_users_company_pin_digest
  ON users (company_id, pin_digest)
  WHERE company_id IS NOT NULL AND pin_digest IS NOT NULL;

