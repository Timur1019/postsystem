-- Run manually against pos_db when upgrading (JPA ddl-auto=validate).
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255);

CREATE TABLE IF NOT EXISTS suppliers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    tax_id      VARCHAR(32)  NOT NULL,
    address     VARCHAR(500),
    email       VARCHAR(255),
    phone       VARCHAR(40),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_suppliers_tax_id ON suppliers (tax_id);
