-- Инвентаризация и перемещения между магазинами (учёт в журнале движений)
CREATE TABLE IF NOT EXISTS stock_inventories (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_number  VARCHAR(40) NOT NULL UNIQUE,
    store_id          INT REFERENCES stores(id),
    status            VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    notes             TEXT,
    total_lines       INT NOT NULL DEFAULT 0,
    total_difference  INT NOT NULL DEFAULT 0,
    created_by        UUID REFERENCES users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_inventory_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id    UUID NOT NULL REFERENCES stock_inventories(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    system_quantity INT NOT NULL,
    counted_quantity INT NOT NULL,
    difference      INT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_transfers (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number   VARCHAR(40) NOT NULL UNIQUE,
    from_store_id     INT NOT NULL REFERENCES stores(id),
    to_store_id       INT NOT NULL REFERENCES stores(id),
    notes             TEXT,
    total_quantity    INT NOT NULL DEFAULT 0,
    created_by        UUID REFERENCES users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_transfer_lines (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id  UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id   UUID NOT NULL REFERENCES products(id),
    quantity     INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_stock_inventories_created ON stock_inventories(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_created ON stock_transfers(created_at);
