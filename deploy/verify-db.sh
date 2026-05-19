#!/usr/bin/env bash
# Проверка пароля PostgreSQL из .env (на сервере перед/после деплоя).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

PG_USER="${POSTGRES_USER:-pos_user}"
PG_DB="${POSTGRES_DB:-pos_db}"

echo "==> Проверка входа в PostgreSQL (пользователь $PG_USER)..."
if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  psql -U "$PG_USER" -d "$PG_DB" -c 'SELECT 1 AS ok;' >/dev/null 2>&1; then
  echo "OK: пароль из .env подходит к БД"
  exit 0
fi

echo "ОШИБКА: пароль из .env НЕ подходит к существующей БД."
echo ""
echo "Частая причина: POSTGRES_PASSWORD в .env меняли после первого запуска Postgres."
echo "Исправление (подставит пароль из .env в PostgreSQL):"
echo ""
echo "  cd $ROOT"
echo "  set -a && source .env && set +a"
echo "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T postgres \\"
echo "    psql -U postgres -d postgres -c \"ALTER USER $PG_USER WITH PASSWORD '\$POSTGRES_PASSWORD';\""
echo ""
exit 1
