#!/usr/bin/env bash
# Применяет новые SQL-миграции к работающей БД (идемпотентно, с учётом в app_schema_migrations).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
MANIFEST="${MANIFEST:-deploy/migrations-prod.txt}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

PG_USER="${POSTGRES_USER:-pos_user}"
PG_DB="${POSTGRES_DB:-pos_db}"
MIGRATIONS_DIR="web-backend/src/main/resources/db"

if [[ ! -f "$MANIFEST" ]]; then
  echo "migrate-db: нет манифеста $MANIFEST"
  exit 1
fi

compose() {
  if [[ -f "$ENV_FILE" ]]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker compose -f "$COMPOSE_FILE" "$@"
  fi
}

psql_exec() {
  compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" "$@"
}

echo "==> Ожидание PostgreSQL..."
for _ in $(seq 1 30); do
  if compose exec -T postgres pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! compose exec -T postgres pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
  echo "Ошибка: PostgreSQL не готов"
  exit 1
fi

echo "==> Таблица учёта миграций"
psql_exec -f - <<'SQL'
CREATE TABLE IF NOT EXISTS app_schema_migrations (
    filename    VARCHAR(255) PRIMARY KEY,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

applied_count=0
skipped_count=0

# fd 3 — манифест; stdin не трогаем (docker compose exec иначе съедает остаток файла)
exec 3<"$MANIFEST"
while IFS= read -r line <&3 || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"
  [[ -z "$line" ]] && continue

  f="$MIGRATIONS_DIR/$line"
  if [[ ! -f "$f" ]]; then
    echo "Ошибка: файл не найден: $f"
    exit 1
  fi

  # Безопасное имя для SQL (только basename из манифеста)
  name="$(basename "$line")"
  exists="$(psql_exec -tAc "SELECT 1 FROM app_schema_migrations WHERE filename = '${name//\'/\'\'}' LIMIT 1" | tr -d '[:space:]')"
  if [[ "$exists" == "1" ]]; then
    skipped_count=$((skipped_count + 1))
    continue
  fi

  echo "  -> $name"
  psql_exec -f - <"$f"
  psql_exec -c "INSERT INTO app_schema_migrations (filename) VALUES ('${name//\'/\'\'}');"
  applied_count=$((applied_count + 1))
done
exec 3<&-

echo "==> Миграции: применено $applied_count, пропущено (уже были) $skipped_count"
