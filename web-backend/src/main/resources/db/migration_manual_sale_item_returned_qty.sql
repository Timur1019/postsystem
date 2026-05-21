-- Частичный возврат: сколько единиц по строке чека уже возвращено
ALTER TABLE sale_items
    ADD COLUMN IF NOT EXISTS returned_quantity INT NOT NULL DEFAULT 0;

UPDATE sale_items si
SET returned_quantity = si.quantity
FROM sales s
WHERE s.id = si.sale_id
  AND s.status IN ('VOIDED', 'REFUNDED')
  AND si.returned_quantity = 0;
