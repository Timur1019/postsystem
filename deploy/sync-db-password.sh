#!/usr/bin/env bash
# Синхронизировать пароль пользователя БД с POSTGRES_PASSWORD из .env
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

echo "==> Обновление пароля PostgreSQL для пользователя $PG_USER"
# Внутри контейнера локальный вход без пароля (trust)
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "ALTER USER \"${PG_USER}\" WITH PASSWORD '${POSTGRES_PASSWORD}';"

echo "==> Проверка входа с паролем из .env..."
PGPASSWORD="$POSTGRES_PASSWORD" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T \
  -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
  psql -U "$PG_USER" -d "$PG_DB" -c 'SELECT 1 AS ok;'

echo "OK: пароль синхронизирован"
