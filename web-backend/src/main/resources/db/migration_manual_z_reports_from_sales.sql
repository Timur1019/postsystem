-- Z-отчёты из фактических продаж в POS (закрытые смены).
-- psql "postgresql://pos_user:pos_password@localhost:5433/pos_db" -f web-backend/src/main/resources/db/migration_manual_z_reports_from_sales.sql

UPDATE sales SET store_id = 1 WHERE store_id IS NULL;

-- На обновлённых БД смены уже ссылаются на z_reports — снимаем FK перед пересборкой.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cashier_shifts'
  ) THEN
    UPDATE cashier_shifts
    SET z_report_id = NULL
    WHERE z_report_id IN (SELECT id FROM z_reports WHERE store_id = 1);
  END IF;
END $$;

DELETE FROM z_reports WHERE store_id = 1;

INSERT INTO z_reports (
    store_id, fiscal_card_id, terminal_serial,
    opened_at, closed_at, z_number,
    total_amount, vat_amount, employee_name,
    brand_name, company_name, company_address, tin, applet_version,
    cash_total, card_total, returns_cash, returns_card, vat_return,
    sales_count, returns_count, first_receipt_number, last_receipt_number
)
SELECT
    agg.store_id,
    cr.fiscal_card_id,
    cr.equipment_serial,
    (agg.shift_date + TIME '08:00') AT TIME ZONE 'Asia/Tashkent',
    GREATEST(
        agg.last_sale + INTERVAL '30 minutes',
        (agg.shift_date + TIME '20:00') AT TIME ZONE 'Asia/Tashkent'
    ),
    agg.z_number,
    agg.total_amount,
    ROUND(agg.total_amount * 12 / 112, 2),
    TRIM(COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.last_name, u.first_name)), ''), u.full_name, u.username)),
    'Tinda',
    'MIRONKUL AGRO GLOBAL',
    'Samarqand vil., Samarqan tuman., O''rtashiq MSG., Mardi Maydon ko''chasi 403 uy',
    '305137932',
    '0324',
    agg.cash_total,
    agg.card_total,
    0,
    0,
    0,
    agg.sales_count,
    0,
    agg.first_receipt,
    agg.last_receipt
FROM (
    SELECT
        COALESCE(s.store_id, 1) AS store_id,
        (s.created_at AT TIME ZONE 'Asia/Tashkent')::date AS shift_date,
        s.cashier_id,
        COUNT(*)::int AS sales_count,
        ROUND(SUM(s.total_amount), 2) AS total_amount,
        ROUND(SUM(CASE WHEN s.payment_method = 'CASH' THEN s.total_amount ELSE 0 END), 2) AS cash_total,
        ROUND(SUM(CASE WHEN s.payment_method <> 'CASH' THEN s.total_amount ELSE 0 END), 2) AS card_total,
        MIN(s.created_at) AS first_sale,
        MAX(s.created_at) AS last_sale,
        MIN(s.receipt_number) AS first_receipt,
        MAX(s.receipt_number) AS last_receipt,
        CASE (s.created_at AT TIME ZONE 'Asia/Tashkent')::date
            WHEN DATE '2026-05-14' THEN 48
            WHEN DATE '2026-05-15' THEN 49
            ELSE 40 + ROW_NUMBER() OVER (ORDER BY (s.created_at AT TIME ZONE 'Asia/Tashkent')::date, s.cashier_id)
        END AS z_number
    FROM sales s
    WHERE s.status = 'COMPLETED'
    GROUP BY COALESCE(s.store_id, 1), (s.created_at AT TIME ZONE 'Asia/Tashkent')::date, s.cashier_id
) agg
JOIN users u ON u.id = agg.cashier_id
CROSS JOIN LATERAL (
    SELECT fiscal_card_id, equipment_serial
    FROM cash_registers
    WHERE store_id = agg.store_id AND register_number = 1
    LIMIT 1
) cr
WHERE EXISTS (SELECT 1 FROM stores WHERE id = agg.store_id);
