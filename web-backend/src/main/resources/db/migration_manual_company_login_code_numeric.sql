-- Коды входа: 5 цифр, 10000–99999. Старые буквенные коды (M1, TEST…) заменяются на следующий свободный номер.
-- psql ... -f migration_manual_company_login_code_numeric.sql

DO $$
DECLARE
    rec RECORD;
    next_code INTEGER;
    candidate TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(login_code AS INTEGER)), 9999) + 1
    INTO next_code
    FROM companies
    WHERE login_code ~ '^[0-9]+$'
      AND CAST(login_code AS INTEGER) >= 10000
      AND CAST(login_code AS INTEGER) <= 99999;

    IF next_code < 10000 THEN
        next_code := 10000;
    END IF;

    FOR rec IN
        SELECT id
        FROM companies
        WHERE login_code IS NULL
           OR TRIM(login_code) = ''
           OR login_code !~ '^[0-9]{5}$'
           OR CAST(login_code AS INTEGER) < 10000
           OR CAST(login_code AS INTEGER) > 99999
        ORDER BY id
    LOOP
        LOOP
            candidate := LPAD(next_code::text, 5, '0');
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM companies c
                WHERE LOWER(c.login_code) = LOWER(candidate)
                  AND c.id <> rec.id
            );
            next_code := next_code + 1;
            IF next_code > 99999 THEN
                RAISE EXCEPTION 'No free company login codes left in range 10000-99999';
            END IF;
        END LOOP;

        UPDATE companies
        SET login_code = candidate,
            updated_at = NOW()
        WHERE id = rec.id;

        next_code := next_code + 1;
    END LOOP;
END $$;
