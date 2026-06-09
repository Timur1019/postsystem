#!/usr/bin/env bash
# Резервная копия PostgreSQL (gzip). Запуск на сервере или по cron.
# Использование: bash deploy/backup-db.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "backup-db: нет $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

PG_USER="${POSTGRES_USER:-pos_user}"
PG_DB="${POSTGRES_DB:-pos_db}"

compose() {
  if [[ -f "$ENV_FILE" ]]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker compose -f "$COMPOSE_FILE" "$@"
  fi
}

if ! compose exec -T postgres pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
  echo "backup-db: PostgreSQL не готов"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/pos_db_${STAMP}.sql.gz"

echo "==> pg_dump → $OUT"
compose exec -T postgres pg_dump \
  -U "$PG_USER" \
  -d "$PG_DB" \
  --no-owner \
  --no-acl \
  | gzip -9 >"$OUT"

SIZE="$(du -h "$OUT" | awk '{print $1}')"
echo "==> Готово: $OUT ($SIZE)"

if [[ "$RETENTION_DAYS" -gt 0 ]]; then
  DELETED="$(find "$BACKUP_DIR" -maxdepth 1 -name 'pos_db_*.sql.gz' -mtime +"$RETENTION_DAYS" -print -delete | wc -l | tr -d ' ')"
  echo "==> Удалено старых бэкапов (>${RETENTION_DAYS} дн.): $DELETED"
fi
