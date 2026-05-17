-- Конфигурации касс (cash_register_configs + связи).
-- Для уже существующей БД при ddl-auto=validate:
--   psql "$DB_URL" -f web-backend/src/main/resources/db/migration_manual_cash_register_configs.sql

CREATE TABLE IF NOT EXISTS cash_register_configs (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(200) NOT NULL UNIQUE,
    locked_default   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_register_config_stores (
    config_id  BIGINT NOT NULL REFERENCES cash_register_configs(id) ON DELETE CASCADE,
    store_id   INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    PRIMARY KEY (config_id, store_id)
);

CREATE TABLE IF NOT EXISTS cash_register_config_registers (
    config_id         BIGINT NOT NULL REFERENCES cash_register_configs(id) ON DELETE CASCADE,
    cash_register_id  BIGINT NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
    PRIMARY KEY (config_id, cash_register_id)
);

CREATE TABLE IF NOT EXISTS cash_register_config_categories (
    config_id    BIGINT NOT NULL REFERENCES cash_register_configs(id) ON DELETE CASCADE,
    category_id  INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (config_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_crcfg_stores_config ON cash_register_config_stores(config_id);
CREATE INDEX IF NOT EXISTS idx_crcfg_registers_config ON cash_register_config_registers(config_id);
CREATE INDEX IF NOT EXISTS idx_crcfg_categories_config ON cash_register_config_categories(config_id);

INSERT INTO cash_register_configs (name, locked_default)
SELECT 'Конфигурация по умолчанию', TRUE
WHERE NOT EXISTS (SELECT 1 FROM cash_register_configs WHERE locked_default = TRUE);
