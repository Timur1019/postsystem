-- Заказы (customer_orders) + фото заказа (customer_order_photos).
-- DDL совпадает с web-backend/src/main/resources/schema.sql (блок «Customer / delivery orders»).
-- Выполните вручную на существующей БД, если ddl-auto=validate и таблиц ещё нет:
--   psql "$DB_URL" -f web-backend/src/main/resources/db/migration_manual_customer_orders.sql

CREATE TABLE IF NOT EXISTS customer_orders (
    id                 BIGSERIAL PRIMARY KEY,
    store_id           INT NOT NULL REFERENCES stores(id),
    external_number    VARCHAR(100),
    status             VARCHAR(30) NOT NULL DEFAULT 'NEW',
    client_name        VARCHAR(255),
    client_phone       VARCHAR(40),
    delivery_address   TEXT,
    comment            TEXT,
    courier_id         UUID REFERENCES users(id),
    payment_method     VARCHAR(20),
    receipt_number     VARCHAR(50),
    receipt_at         TIMESTAMPTZ,
    total_amount       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    created_by         UUID NOT NULL REFERENCES users(id),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_orders_store ON customer_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_created ON customer_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);

CREATE TABLE IF NOT EXISTS customer_order_photos (
    id            BIGSERIAL PRIMARY KEY,
    order_id      BIGINT NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
    slot          INT NOT NULL CHECK (slot >= 1 AND slot <= 5),
    file_name     VARCHAR(255) NOT NULL,
    content_type  VARCHAR(120) NOT NULL,
    UNIQUE (order_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_customer_order_photos_order ON customer_order_photos(order_id);
