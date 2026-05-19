-- Доступ к модулям админки по пользователю (настраивает SUPER_ADMIN)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS module_access_custom BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS user_module_access (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_key  VARCHAR(64) NOT NULL,
    allowed     BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_user_module_access_user ON user_module_access(user_id);
