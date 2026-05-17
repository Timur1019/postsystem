-- Убрать ошибочный «магазин» с ФИО пользователя (не юридический магазин).
UPDATE stores SET is_active = FALSE WHERE id = 2 AND name = 'Timur Raximberdiev';
