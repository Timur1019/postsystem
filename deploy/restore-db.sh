#!/usr/bin/env bash
# Восстановление БД из gzip-дампа. ОСТОРОЖНО: перезаписывает текущую БД.
# Использование: bash deploy/restore-db.sh backups/postgres/pos_db_20260610_030001.sql.gz
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Использование: $0 <путь-к-pos_db_*.sql.gz>"
  exit 1
fi

DUMP="$1"
if [[ ! -f "$DUMP" ]]; then
  echo "Файл не найден: $DUMP"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

PG_USER="${POSTGRES_USER:-pos_user}"
PG_DB="${POSTGRES_DB:-pos_db}"

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

echo "==> Останов backend (чтобы не писал в БД во время restore)..."
compose stop backend 2>/dev/null || true

echo "==> Восстановление из $DUMP"
gunzip -c "$DUMP" | compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB"

echo "==> Запуск backend..."
compose up -d backend

echo "==> Готово. Проверьте: curl -s http://localhost:8080/api/v1/actuator/health"
