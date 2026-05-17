-- Z-отчёты: таблица (существующая БД, ddl-auto=validate).
-- Демо-данные для «Передача кассы»: migration_manual_cash_transfer_demo.sql

CREATE TABLE IF NOT EXISTS z_reports (
    id                      BIGSERIAL PRIMARY KEY,
    store_id                INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    fiscal_card_id          VARCHAR(100) NOT NULL,
    terminal_serial         VARCHAR(100),
    opened_at               TIMESTAMPTZ NOT NULL,
    closed_at               TIMESTAMPTZ NOT NULL,
    z_number                INT NOT NULL,
    total_amount            NUMERIC(18, 2) NOT NULL,
    vat_amount              NUMERIC(18, 2) NOT NULL,
    employee_name           VARCHAR(255) NOT NULL,
    brand_name              VARCHAR(200),
    company_name            VARCHAR(255),
    company_address         TEXT,
    tin                     VARCHAR(32),
    applet_version          VARCHAR(32),
    cash_total              NUMERIC(18, 2) DEFAULT 0,
    card_total              NUMERIC(18, 2) DEFAULT 0,
    returns_cash            NUMERIC(18, 2) DEFAULT 0,
    returns_card            NUMERIC(18, 2) DEFAULT 0,
    vat_return              NUMERIC(18, 2) DEFAULT 0,
    sales_count             INT DEFAULT 0,
    returns_count           INT DEFAULT 0,
    first_receipt_number    VARCHAR(50),
    last_receipt_number     VARCHAR(50),
    UNIQUE (store_id, z_number)
);

CREATE INDEX IF NOT EXISTS idx_z_reports_store ON z_reports(store_id);
CREATE INDEX IF NOT EXISTS idx_z_reports_closed_at ON z_reports(closed_at);
