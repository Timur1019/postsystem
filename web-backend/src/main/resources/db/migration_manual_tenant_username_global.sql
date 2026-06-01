-- Глобально уникальный логин для пользователей компаний (админ входит без кода компании)
-- psql ... -f migration_manual_tenant_username_global.sql
-- Перед применением убедитесь, что нет одинаковых логинов в разных компаниях.

DROP INDEX IF EXISTS uq_users_company_username;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_tenant_username ON users (LOWER(username))
  WHERE company_id IS NOT NULL;
