-- Платформенные настройки безопасности (пароль настройки сервера кассы и др.).
CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key   VARCHAR(64) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE platform_settings IS 'Key-value настройки платформы (SUPER_ADMIN).';
