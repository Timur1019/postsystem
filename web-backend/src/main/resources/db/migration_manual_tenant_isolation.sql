-- Multi-tenant isolation: company_id, store_stock, sales.company_id, RLS.
-- Идемпотентно: безопасно для повторного запуска и deploy/migrate-db.sh.

-- ============================================================
-- 1. company_id на products, categories, customers, suppliers
-- ============================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE CASCADE;

DO $$
DECLARE
    default_company_id INT;
BEGIN
    SELECT id INTO default_company_id FROM companies ORDER BY id LIMIT 1;
    IF default_company_id IS NULL THEN
        RAISE NOTICE 'tenant_isolation: companies empty, skip backfill';
        RETURN;
    END IF;

    UPDATE categories SET company_id = default_company_id
    WHERE company_id IS NULL;

    UPDATE products SET company_id = default_company_id
    WHERE company_id IS NULL;

    UPDATE customers SET company_id = default_company_id
    WHERE company_id IS NULL;

    UPDATE suppliers SET company_id = default_company_id
    WHERE company_id IS NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'categories'
          AND column_name = 'company_id' AND is_nullable = 'YES'
    ) AND NOT EXISTS (SELECT 1 FROM categories WHERE company_id IS NULL) THEN
        ALTER TABLE categories ALTER COLUMN company_id SET NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products'
          AND column_name = 'company_id' AND is_nullable = 'YES'
    ) AND NOT EXISTS (SELECT 1 FROM products WHERE company_id IS NULL) THEN
        ALTER TABLE products ALTER COLUMN company_id SET NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers'
          AND column_name = 'company_id' AND is_nullable = 'YES'
    ) AND NOT EXISTS (SELECT 1 FROM customers WHERE company_id IS NULL) THEN
        ALTER TABLE customers ALTER COLUMN company_id SET NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'suppliers'
          AND column_name = 'company_id' AND is_nullable = 'YES'
    ) AND NOT EXISTS (SELECT 1 FROM suppliers WHERE company_id IS NULL) THEN
        ALTER TABLE suppliers ALTER COLUMN company_id SET NOT NULL;
    END IF;
END $$;

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
DROP INDEX IF EXISTS uq_categories_company_name;
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_company_name ON categories(company_id, lower(name));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_barcode_key;
DROP INDEX IF EXISTS uq_products_company_sku;
DROP INDEX IF EXISTS uq_products_company_barcode;
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_company_sku ON products(company_id, sku);
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_company_barcode ON products(company_id, barcode) WHERE barcode IS NOT NULL;

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;
DROP INDEX IF EXISTS uq_customers_company_phone;
DROP INDEX IF EXISTS uq_customers_company_email;
CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_company_phone ON customers(company_id, phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_company_email ON customers(company_id, email) WHERE email IS NOT NULL;

ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_tax_id_key;
DROP INDEX IF EXISTS uq_suppliers_company_tax_id;
CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_company_tax_id ON suppliers(company_id, tax_id);

CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_categories_company ON categories(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);

-- ============================================================
-- 2. Per-store inventory
-- ============================================================
CREATE TABLE IF NOT EXISTS store_stock (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id    INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    quantity    INT NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_store_stock_store ON store_stock(store_id);
CREATE INDEX IF NOT EXISTS idx_store_stock_product ON store_stock(product_id);

INSERT INTO store_stock (product_id, store_id, quantity)
SELECT p.id, s.id, p.stock_quantity
FROM products p
JOIN stores s ON s.company_id = p.company_id
WHERE NOT EXISTS (
    SELECT 1 FROM store_stock ss WHERE ss.product_id = p.id AND ss.store_id = s.id
);

UPDATE products p
SET stock_quantity = COALESCE((
    SELECT SUM(ss.quantity) FROM store_stock ss
    JOIN stores st ON st.id = ss.store_id
    WHERE ss.product_id = p.id AND st.company_id = p.company_id
), 0);

-- ============================================================
-- 3. sales.company_id
-- ============================================================
ALTER TABLE sales ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE SET NULL;

UPDATE sales s
SET company_id = st.company_id
FROM stores st
WHERE s.store_id = st.id AND s.company_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_company_created ON sales(company_id, created_at);
DROP INDEX IF EXISTS idx_sales_company_completed_created;
CREATE INDEX IF NOT EXISTS idx_sales_company_completed_created
    ON sales(company_id, created_at) WHERE status = 'COMPLETED';

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_products ON products;
CREATE POLICY tenant_products ON products
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR company_id = NULLIF(current_setting('app.company_id', true), '')::INT
    );

DROP POLICY IF EXISTS tenant_categories ON categories;
CREATE POLICY tenant_categories ON categories
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR company_id = NULLIF(current_setting('app.company_id', true), '')::INT
    );

DROP POLICY IF EXISTS tenant_customers ON customers;
CREATE POLICY tenant_customers ON customers
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR company_id = NULLIF(current_setting('app.company_id', true), '')::INT
    );

DROP POLICY IF EXISTS tenant_suppliers ON suppliers;
CREATE POLICY tenant_suppliers ON suppliers
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR company_id = NULLIF(current_setting('app.company_id', true), '')::INT
    );

DROP POLICY IF EXISTS tenant_store_stock ON store_stock;
CREATE POLICY tenant_store_stock ON store_stock
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR EXISTS (
            SELECT 1 FROM stores st
            WHERE st.id = store_stock.store_id
              AND st.company_id = NULLIF(current_setting('app.company_id', true), '')::INT
        )
    );

DROP POLICY IF EXISTS tenant_sales ON sales;
CREATE POLICY tenant_sales ON sales
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR company_id = NULLIF(current_setting('app.company_id', true), '')::INT
    );
