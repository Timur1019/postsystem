-- Настройки брендинга и чека (синхронизация веб / десктоп).
-- Применяется через deploy/migrate-db.sh (см. deploy/migrations-prod.txt) и docker-entrypoint-initdb.d/22.

CREATE TABLE IF NOT EXISTS company_tenant_display_settings (
    company_id   INT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    settings     JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_tenant_display_settings_updated
    ON company_tenant_display_settings (updated_at DESC);
