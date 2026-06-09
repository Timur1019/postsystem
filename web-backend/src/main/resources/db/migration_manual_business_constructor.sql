-- Конструктор бизнеса: типы, поля товара, значения attributes.
-- deploy/migrate-db.sh (см. deploy/migrations-prod.txt)

CREATE TABLE IF NOT EXISTS business_types (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(32) NOT NULL UNIQUE,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 100,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_type_fields (
    id               SERIAL PRIMARY KEY,
    business_type_id INT NOT NULL REFERENCES business_types (id) ON DELETE CASCADE,
    field_key        VARCHAR(64) NOT NULL,
    label            VARCHAR(200) NOT NULL,
    field_type       VARCHAR(20) NOT NULL,
    required         BOOLEAN NOT NULL DEFAULT FALSE,
    enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order       INT NOT NULL DEFAULT 100,
    placeholder      VARCHAR(200),
    hint             TEXT,
    CONSTRAINT uq_business_type_field_key UNIQUE (business_type_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_business_type_fields_type ON business_type_fields (business_type_id, sort_order);

CREATE TABLE IF NOT EXISTS field_options (
    id         SERIAL PRIMARY KEY,
    field_id   INT NOT NULL REFERENCES business_type_fields (id) ON DELETE CASCADE,
    value      VARCHAR(100) NOT NULL,
    label      VARCHAR(200) NOT NULL,
    sort_order INT NOT NULL DEFAULT 100
);

CREATE INDEX IF NOT EXISTS idx_field_options_field ON field_options (field_id, sort_order);

CREATE TABLE IF NOT EXISTS product_attributes (
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    field_key  VARCHAR(64) NOT NULL,
    value_text TEXT,
    PRIMARY KEY (product_id, field_key)
);

INSERT INTO business_types (code, name, description, sort_order)
VALUES
    ('CONSTRUCTION', 'Стройматериалы', 'Вес, объём, размеры, упаковки', 10),
    ('GROCERY', 'Продукты', 'Срок годности, партия, производитель', 20),
    ('CLOTHING', 'Одежда', 'Размер, цвет, пол, сезон', 30),
    ('PHARMACY', 'Аптека', 'Срок годности, партия, рецепт', 40),
    ('CANTEEN', 'Столовая', 'Блюда и продукты', 50),
    ('RESTAURANT', 'Ресторан', 'Блюда и напитки', 60),
    ('AUTO_PARTS', 'Автозапчасти', 'Марка авто, артикул', 70),
    ('UNIVERSAL', 'Универсальный', 'Базовый набор полей', 99),
    ('OTHER', 'Другое', 'Произвольные поля', 100)
ON CONFLICT (code) DO NOTHING;

-- Одежда
INSERT INTO business_type_fields (business_type_id, field_key, label, field_type, required, sort_order, placeholder)
SELECT bt.id, v.field_key, v.label, v.field_type, v.required, v.sort_order, v.placeholder
FROM business_types bt
CROSS JOIN (VALUES
    ('brand', 'Бренд', 'TEXT', FALSE, 10, NULL),
    ('size', 'Размер', 'LIST', TRUE, 20, NULL),
    ('color', 'Цвет', 'TEXT', TRUE, 30, NULL),
    ('gender', 'Пол', 'LIST', FALSE, 40, NULL),
    ('season', 'Сезон', 'LIST', FALSE, 50, NULL),
    ('material', 'Материал', 'TEXT', FALSE, 60, NULL)
) AS v(field_key, label, field_type, required, sort_order, placeholder)
WHERE bt.code = 'CLOTHING'
ON CONFLICT (business_type_id, field_key) DO NOTHING;

INSERT INTO field_options (field_id, value, label, sort_order)
SELECT f.id, v.value, v.label, v.sort_order
FROM business_type_fields f
JOIN business_types bt ON bt.id = f.business_type_id AND bt.code = 'CLOTHING'
CROSS JOIN (VALUES
    ('size', 'S', 'S', 10),
    ('size', 'M', 'M', 20),
    ('size', 'L', 'L', 30),
    ('size', 'XL', 'XL', 40),
    ('size', 'XXL', 'XXL', 50),
    ('gender', 'UNISEX', 'Унисекс', 10),
    ('gender', 'MALE', 'Мужской', 20),
    ('gender', 'FEMALE', 'Женский', 30),
    ('gender', 'KIDS', 'Детский', 40),
    ('season', 'SUMMER', 'Лето', 10),
    ('season', 'WINTER', 'Зима', 20),
    ('season', 'DEMI', 'Демисезон', 30)
) AS v(field_key, value, label, sort_order)
WHERE f.field_key = v.field_key
  AND NOT EXISTS (
      SELECT 1 FROM field_options fo
      WHERE fo.field_id = f.id AND fo.value = v.value
  );

-- Продукты
INSERT INTO business_type_fields (business_type_id, field_key, label, field_type, required, sort_order)
SELECT bt.id, v.field_key, v.label, v.field_type, v.required, v.sort_order
FROM business_types bt
CROSS JOIN (VALUES
    ('expiry_date', 'Срок годности', 'DATE', FALSE, 10),
    ('batch', 'Партия', 'TEXT', FALSE, 20),
    ('manufacturer', 'Производитель', 'TEXT', FALSE, 30),
    ('min_stock', 'Мин. остаток (шт)', 'NUMBER', FALSE, 40)
) AS v(field_key, label, field_type, required, sort_order)
WHERE bt.code = 'GROCERY'
ON CONFLICT (business_type_id, field_key) DO NOTHING;

-- Стройматериалы
INSERT INTO business_type_fields (business_type_id, field_key, label, field_type, required, sort_order)
SELECT bt.id, v.field_key, v.label, v.field_type, v.required, v.sort_order
FROM business_types bt
CROSS JOIN (VALUES
    ('material_type', 'Тип материала', 'TEXT', FALSE, 10),
    ('weight_kg', 'Вес, кг', 'NUMBER', FALSE, 20),
    ('volume_m3', 'Объём, м³', 'NUMBER', FALSE, 30),
    ('length_m', 'Длина, м', 'NUMBER', FALSE, 40),
    ('width_m', 'Ширина, м', 'NUMBER', FALSE, 50),
    ('thickness_mm', 'Толщина, мм', 'NUMBER', FALSE, 60)
) AS v(field_key, label, field_type, required, sort_order)
WHERE bt.code = 'CONSTRUCTION'
ON CONFLICT (business_type_id, field_key) DO NOTHING;

COMMENT ON TABLE business_types IS 'Справочник типов бизнеса (конструктор)';
COMMENT ON TABLE business_type_fields IS 'Настраиваемые поля товара по типу бизнеса';
COMMENT ON TABLE product_attributes IS 'Значения динамических полей товара';
