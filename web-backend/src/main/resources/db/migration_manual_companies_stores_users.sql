-- Компании, расширение магазинов/пользователей, SUPER_ADMIN.
-- psql ... -f migration_manual_companies_stores_users.sql

CREATE TABLE IF NOT EXISTS companies (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    legal_name   VARCHAR(255),
    tin          VARCHAR(20),
    address      TEXT,
    phone        VARCHAR(50),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS patronymic VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS user_stores (
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id  INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_stores_company ON stores(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_user ON user_stores(user_id);

INSERT INTO roles (name, description)
SELECT 'SUPER_ADMIN', 'Platform operator — companies and global administration'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'SUPER_ADMIN');

INSERT INTO companies (name, legal_name, address, phone, is_active)
SELECT 'MIRONKUL AGRO GLOBAL', 'MIRONKUL AGRO GLOBAL',
       'Samarqand vil., Samarqan tuman., O''rtashiq MSG., Mardi Maydon ko''chasi 403 uy',
       NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'MIRONKUL AGRO GLOBAL');

UPDATE stores s
SET name = 'MIRONKUL AGRO GLOBAL',
    address = COALESCE(s.address, 'Samarqand vil., Samarqan tuman., O''rtashiq MSG., Mardi Maydon ko''chasi 403 uy'),
    company_id = (SELECT id FROM companies WHERE name = 'MIRONKUL AGRO GLOBAL' LIMIT 1)
WHERE s.id = 1 AND EXISTS (SELECT 1 FROM companies WHERE name = 'MIRONKUL AGRO GLOBAL');

UPDATE users u
SET company_id = (SELECT id FROM companies WHERE name = 'MIRONKUL AGRO GLOBAL' LIMIT 1),
    first_name = COALESCE(u.first_name, split_part(u.full_name, ' ', 1)),
    last_name = COALESCE(u.last_name, NULLIF(split_part(u.full_name, ' ', 2), ''))
WHERE u.username = 'admin'
  AND EXISTS (SELECT 1 FROM companies WHERE name = 'MIRONKUL AGRO GLOBAL');

INSERT INTO user_stores (user_id, store_id)
SELECT u.id, 1
FROM users u
WHERE u.username = 'admin'
  AND EXISTS (SELECT 1 FROM stores WHERE id = 1)
  AND NOT EXISTS (
      SELECT 1 FROM user_stores us WHERE us.user_id = u.id AND us.store_id = 1
  );

-- superadmin / password (bcrypt, same as admin seed)
INSERT INTO users (username, email, password, full_name, first_name, last_name, role_id, company_id, is_active)
SELECT 'superadmin', 'superadmin@platform.local',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       'Super Administrator', 'Super', 'Administrator',
       r.id, NULL, TRUE
FROM roles r
WHERE r.name = 'SUPER_ADMIN'
  AND NOT EXISTS (SELECT 1 FROM users WHERE username = 'superadmin');
