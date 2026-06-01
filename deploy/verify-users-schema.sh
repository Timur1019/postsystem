#!/usr/bin/env bash
# Проверка колонок users, нужных для создания пользователей и PIN-входа.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

PG_USER="${POSTGRES_USER:-pos_user}"
PG_DB="${POSTGRES_DB:-pos_db}"

compose() {
  if [[ -f "$ENV_FILE" ]]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker compose -f "$COMPOSE_FILE" "$@"
  fi
}

echo "==> Колонки users (pin_digest, module_access_custom):"
compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
  AND column_name IN ('pin_digest', 'module_access_custom')
ORDER BY column_name;
"

echo "==> Индексы логина users:"
compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -c "
SELECT indexname FROM pg_indexes
WHERE tablename = 'users' AND indexname LIKE '%username%'
ORDER BY indexname;
"
