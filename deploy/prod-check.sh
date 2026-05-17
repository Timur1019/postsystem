#!/usr/bin/env bash
# Проверка готовности к production-деплою (локально или на сервере перед deploy.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env}"
ERR=0

warn() { echo "  [!] $*"; ERR=1; }
ok()   { echo "  [ok] $*"; }

echo "==> Aurent POS — проверка перед продом"
echo ""

echo "1. Файлы и секреты"
if [[ ! -f "$ENV_FILE" ]]; then
  warn "Нет $ENV_FILE — выполните: cp .env.example .env"
else
  ok "$ENV_FILE найден"
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
  if [[ "${JWT_SECRET:-}" == *"CHANGE_ME"* ]] || [[ ${#JWT_SECRET:-0} -lt 32 ]]; then
    warn "JWT_SECRET: минимум 32 символа, не CHANGE_ME"
  else
    ok "JWT_SECRET задан"
  fi
  if [[ "${POSTGRES_PASSWORD:-}" == *"CHANGE_ME"* ]] || [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
    warn "POSTGRES_PASSWORD не задан"
  else
    ok "POSTGRES_PASSWORD задан"
  fi
fi

echo ""
echo "2. Сборка backend (Maven)"
if command -v mvn >/dev/null 2>&1; then
  if mvn -q -f web-backend/pom.xml clean package -DskipTests; then
    ok "web-backend собирается"
  else
    warn "Ошибка сборки web-backend"
  fi
else
  warn "mvn не найден — пропуск локальной сборки Java"
fi

echo ""
echo "3. Сборка frontend (npm)"
if command -v npm >/dev/null 2>&1 && [[ -f web-frontend/package.json ]]; then
  if (cd web-frontend && npm run build >/dev/null); then
    ok "web-frontend собирается"
  else
    warn "Ошибка сборки web-frontend"
  fi
else
  warn "npm не найден — пропуск сборки фронта"
fi

echo ""
echo "4. Docker Compose (prod)"
if command -v docker >/dev/null 2>&1; then
  if [[ -f "$ENV_FILE" ]]; then
    if docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" config -q 2>/dev/null; then
      ok "docker-compose.prod.yml валиден"
    else
      warn "docker-compose.prod.yml — ошибка конфигурации"
    fi
  else
    warn "docker compose config — нужен .env"
  fi
else
  warn "docker не найден"
fi

echo ""
echo "5. Обязательные SQL-миграции в compose"
for f in \
  schema.sql \
  db/migration_manual_customer_orders.sql \
  db/migration_manual_cash_register_configs.sql \
  db/migration_manual_companies_stores_users.sql \
  db/migration_manual_sales_store.sql \
  db/migration_manual_z_reports_from_sales.sql \
  db/migration_manual_cashier_shifts.sql
do
  if [[ -f "web-backend/src/main/resources/$f" ]]; then
    ok "$f"
  else
    warn "Отсутствует web-backend/src/main/resources/$f"
  fi
done

echo ""
if [[ "$ERR" -eq 0 ]]; then
  echo "Готово к деплою. На сервере: bash deploy/deploy.sh"
  exit 0
fi

echo "Исправьте замечания выше перед выкладкой на прод."
exit 1
