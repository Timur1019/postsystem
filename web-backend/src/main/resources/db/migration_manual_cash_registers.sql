-- Кассы: таблица + пример строки (выполните вручную на существующей БД, если ddl-auto=validate).
CREATE TABLE IF NOT EXISTS cash_registers (
    id                  BIGSERIAL PRIMARY KEY,
    store_id            INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    register_number     INT NOT NULL DEFAULT 1,
    equipment_model     VARCHAR(100),
    equipment_serial    VARCHAR(100),
    fiscal_card_id      VARCHAR(100),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    UNIQUE (store_id, register_number)
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_store ON cash_registers(store_id);

INSERT INTO cash_registers (store_id, register_number, equipment_model, equipment_serial, fiscal_card_id, status)
SELECT 1, 1, 'A930', '1171615664', 'UZ210317231786', 'ACTIVE'
WHERE EXISTS (SELECT 1 FROM stores WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM cash_registers WHERE store_id = 1 AND register_number = 1);
