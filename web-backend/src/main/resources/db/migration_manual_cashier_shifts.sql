-- Cashier shifts + sale receipt metadata (idempotent)
CREATE TABLE IF NOT EXISTS cashier_shifts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id      UUID NOT NULL REFERENCES users(id),
    store_id        INT NOT NULL REFERENCES stores(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,
    sale_count      INT NOT NULL DEFAULT 0,
    total_amount    NUMERIC(18, 2) NOT NULL DEFAULT 0,
    cash_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    card_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    vat_amount      NUMERIC(18, 2) NOT NULL DEFAULT 0,
    z_report_id     BIGINT REFERENCES z_reports(id)
);

CREATE INDEX IF NOT EXISTS idx_cashier_shifts_cashier_status ON cashier_shifts(cashier_id, status);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_store_opened ON cashier_shifts(store_id, opened_at);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS receipt_type VARCHAR(20) DEFAULT 'SALE';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS card_type VARCHAR(20);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashier_shift_id UUID REFERENCES cashier_shifts(id);

CREATE INDEX IF NOT EXISTS idx_sales_cashier_shift ON sales(cashier_shift_id);
