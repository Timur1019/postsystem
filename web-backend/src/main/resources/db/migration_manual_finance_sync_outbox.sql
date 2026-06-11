CREATE TABLE IF NOT EXISTS finance_sync_outbox (
    id UUID PRIMARY KEY,
    event_type VARCHAR(40) NOT NULL,
    target_path VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_retry_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_sync_outbox_idempotency
    ON finance_sync_outbox (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_finance_sync_outbox_retry
    ON finance_sync_outbox (status, next_retry_at);
