-- Справочник единиц измерения и конвертации (учёт + приёмка).
-- deploy/migrate-db.sh + docker-entrypoint-initdb.d/33-units_catalog.sql

ALTER TABLE products
    ALTER COLUMN unit_code TYPE VARCHAR(16);

CREATE TABLE IF NOT EXISTS units (
    code              VARCHAR(16) PRIMARY KEY,
    category          VARCHAR(20) NOT NULL,
    label_ru          VARCHAR(64) NOT NULL,
    label_uz          VARCHAR(64),
    label_short_ru    VARCHAR(16) NOT NULL,
    quantity_scale    INT NOT NULL DEFAULT 0,
    allow_fraction    BOOLEAN NOT NULL DEFAULT FALSE,
    pos_min_qty       NUMERIC(18, 6) NOT NULL DEFAULT 1,
    pos_step          NUMERIC(18, 6) NOT NULL DEFAULT 1,
    sort_order        INT NOT NULL DEFAULT 100,
    enabled           BOOLEAN NOT NULL DEFAULT TRUE,
    stock_allowed     BOOLEAN NOT NULL DEFAULT TRUE,
    receipt_only      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS unit_conversions (
    from_code   VARCHAR(16) NOT NULL REFERENCES units (code),
    to_code     VARCHAR(16) NOT NULL REFERENCES units (code),
    factor      NUMERIC(24, 12) NOT NULL,
    PRIMARY KEY (from_code, to_code)
);

INSERT INTO units (code, category, label_ru, label_uz, label_short_ru, quantity_scale, allow_fraction, pos_min_qty, pos_step, sort_order, stock_allowed, receipt_only)
VALUES
    ('T', 'MASS', 'Тонна', 'Tonna', 'т', 3, TRUE, 0.001, 0.1, 5, FALSE, TRUE),
    ('KG', 'MASS', 'Килограмм', 'Kilogramm', 'кг', 3, TRUE, 0.001, 0.1, 10, TRUE, FALSE),
    ('G', 'MASS', 'Грамм', 'Gramm', 'г', 0, TRUE, 1, 1, 20, TRUE, FALSE),
    ('MG', 'MASS', 'Миллиграмм', 'Milligramm', 'мг', 0, TRUE, 1, 1, 30, TRUE, FALSE),
    ('M3', 'VOLUME', 'Кубический метр', 'Kub metr', 'м³', 3, TRUE, 0.001, 0.1, 40, TRUE, FALSE),
    ('L', 'VOLUME', 'Литр', 'Litr', 'л', 3, TRUE, 0.001, 0.1, 50, TRUE, FALSE),
    ('ML', 'VOLUME', 'Миллилитр', 'Millilitr', 'мл', 0, TRUE, 1, 1, 60, TRUE, FALSE),
    ('KM', 'LENGTH', 'Километр', 'Kilometr', 'км', 3, TRUE, 0.001, 0.1, 70, TRUE, FALSE),
    ('M', 'LENGTH', 'Метр', 'Metr', 'м', 3, TRUE, 0.001, 0.1, 80, TRUE, FALSE),
    ('CM', 'LENGTH', 'Сантиметр', 'Santimetr', 'см', 0, TRUE, 1, 1, 90, TRUE, FALSE),
    ('MM', 'LENGTH', 'Миллиметр', 'Millimetr', 'мм', 0, TRUE, 1, 1, 100, TRUE, FALSE),
    ('M2', 'AREA', 'Квадратный метр', 'Kvadrat metr', 'м²', 3, TRUE, 0.001, 0.1, 110, TRUE, FALSE),
    ('CM2', 'AREA', 'Квадратный сантиметр', 'Kvadrat santimetr', 'см²', 0, TRUE, 1, 1, 120, TRUE, FALSE),
    ('PCS', 'COUNT', 'Штука', 'Dona', 'шт', 0, FALSE, 1, 1, 200, TRUE, FALSE),
    ('PAIR', 'COUNT', 'Пара', 'Juft', 'пар', 0, FALSE, 1, 1, 210, TRUE, FALSE),
    ('SET', 'COUNT', 'Комплект', 'To''plam', 'компл.', 0, FALSE, 1, 1, 220, TRUE, FALSE),
    ('PACK', 'COUNT', 'Упаковка', 'Qadoq', 'упак.', 0, FALSE, 1, 1, 230, TRUE, FALSE),
    ('BOX', 'COUNT', 'Коробка', 'Quti', 'кор.', 0, FALSE, 1, 1, 240, TRUE, FALSE),
    ('BAG', 'COUNT', 'Мешок', 'Xalta', 'меш.', 0, FALSE, 1, 1, 250, FALSE, TRUE),
    ('ROLL', 'COUNT', 'Рулон', 'Rulon', 'рул.', 0, FALSE, 1, 1, 260, TRUE, FALSE),
    ('COIL', 'COUNT', 'Бухта', 'Bukta', 'бухта', 0, FALSE, 1, 1, 270, FALSE, TRUE),
    ('PALLET', 'COUNT', 'Палета', 'Palleta', 'пал.', 0, FALSE, 1, 1, 280, FALSE, TRUE),
    ('SHEET', 'COUNT', 'Лист', 'Varaq', 'лист', 0, FALSE, 1, 1, 290, TRUE, FALSE),
    ('HOUR', 'TIME', 'Час', 'Soat', 'ч', 0, FALSE, 1, 1, 300, TRUE, FALSE),
    ('DAY', 'TIME', 'День', 'Kun', 'дн', 0, FALSE, 1, 1, 310, TRUE, FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO unit_conversions (from_code, to_code, factor)
VALUES
    ('T', 'KG', 1000),
    ('G', 'KG', 0.001),
    ('MG', 'KG', 0.000001),
    ('ML', 'L', 0.001),
    ('CM', 'M', 0.01),
    ('MM', 'M', 0.001),
    ('KM', 'M', 1000),
    ('CM2', 'M2', 0.0001)
ON CONFLICT (from_code, to_code) DO NOTHING;

COMMENT ON TABLE units IS 'Справочник единиц: учёт (stock_allowed) и приёмка (receipt_only)';
COMMENT ON TABLE unit_conversions IS 'Фиксированные коэффициенты: qty_to = qty_from * factor';
