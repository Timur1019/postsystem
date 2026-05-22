-- Документ «Приход» (несколько строк) + связь с движениями
CREATE TABLE IF NOT EXISTS stock_receipts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number  VARCHAR(40) NOT NULL UNIQUE,
    supplier_id     UUID REFERENCES suppliers(id),
    store_id        INT REFERENCES stores(id),
    notes           TEXT,
    total_quantity  INT NOT NULL DEFAULT 0,
    total_cost      NUMERIC(18, 2) NOT NULL DEFAULT 0,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_receipt_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id          UUID NOT NULL REFERENCES stock_receipts(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id),
    quantity            INT NOT NULL CHECK (quantity > 0),
    purchase_price      NUMERIC(18, 2) NOT NULL,
    unit_selling_price  NUMERIC(18, 2) NOT NULL,
    line_cost           NUMERIC(18, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_receipts_created ON stock_receipts(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_receipt_lines_receipt ON stock_receipt_lines(receipt_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_id);
