-- Код компании для входа + уникальность логина/email внутри компании
-- psql ... -f migration_manual_company_login_code.sql

ALTER TABLE companies ADD COLUMN IF NOT EXISTS login_code VARCHAR(32);

UPDATE companies
SET login_code = 'C' || id::text
WHERE login_code IS NULL OR TRIM(login_code) = '';

ALTER TABLE companies ALTER COLUMN login_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_login_code ON companies (LOWER(login_code));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

DROP INDEX IF EXISTS uq_users_company_username;
DROP INDEX IF EXISTS uq_users_company_email;
DROP INDEX IF EXISTS uq_users_platform_username;
DROP INDEX IF EXISTS uq_users_platform_email;

CREATE UNIQUE INDEX uq_users_company_username ON users (company_id, LOWER(username))
  WHERE company_id IS NOT NULL;

CREATE UNIQUE INDEX uq_users_company_email ON users (company_id, LOWER(email))
  WHERE company_id IS NOT NULL;

CREATE UNIQUE INDEX uq_users_platform_username ON users (LOWER(username))
  WHERE company_id IS NULL;

CREATE UNIQUE INDEX uq_users_platform_email ON users (LOWER(email))
  WHERE company_id IS NULL;
