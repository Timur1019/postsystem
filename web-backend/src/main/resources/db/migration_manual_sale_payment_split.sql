-- Разбивка оплаты для смешанных чеков (наличные + карта)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(18, 2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS card_amount NUMERIC(18, 2) NOT NULL DEFAULT 0;

UPDATE sales SET cash_amount = total_amount, card_amount = 0
WHERE payment_method = 'CASH' AND (cash_amount = 0 OR cash_amount IS NULL);

UPDATE sales SET cash_amount = 0, card_amount = total_amount
WHERE payment_method IN ('CARD', 'CASHLESS', 'MPESA') AND (card_amount = 0 OR card_amount IS NULL);

UPDATE sales SET cash_amount = total_amount / 2, card_amount = total_amount - (total_amount / 2)
WHERE payment_method = 'MIXED' AND cash_amount = 0 AND card_amount = 0;
