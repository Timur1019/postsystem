#!/usr/bin/env bash
# Проверка готовности к production-деплою (локально или на сервере перед deploy.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env}"
ERR=0

warn() { echo "  [!] $*"; ERR=1; }
ok()   { echo "  [ok] $*"; }
skip() { echo "  [—] $*"; }

HAS_DOCKER=0
command -v docker >/dev/null 2>&1 && HAS_DOCKER=1

echo "==> Aurent POS — проверка перед продом"
echo ""

echo "1. Файлы и секреты"
if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f .env.example ]]; then
    warn "Нет $ENV_FILE — на Mac: bash deploy/setup-env.sh  (или cp .env.example .env && nano .env)"
  else
    warn "Нет $ENV_FILE и .env.example"
  fi
else
  ok "$ENV_FILE найден"
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
  jwt_len="${#JWT_SECRET}"
  if [[ "${JWT_SECRET:-}" == *"CHANGE_ME"* ]] || [[ "${jwt_len:-0}" -lt 32 ]]; then
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
elif [[ "$HAS_DOCKER" -eq 1 ]]; then
  skip "mvn не нужен на сервере — backend соберётся в Docker"
else
  warn "mvn не найден (нужен на Mac без Docker)"
fi

echo ""
echo "3. Сборка frontend (npm)"
if command -v npm >/dev/null 2>&1 && [[ -f web-frontend/package.json ]]; then
  if (cd web-frontend && npm run build >/dev/null); then
    ok "web-frontend собирается"
  else
    warn "Ошибка сборки web-frontend"
  fi
elif [[ "$HAS_DOCKER" -eq 1 ]]; then
  skip "npm не нужен на сервере — frontend соберётся в Docker"
else
  warn "npm не найден (нужен на Mac без Docker)"
fi

echo ""
echo "4. Docker Compose (prod)"
if command -v docker >/dev/null 2>&1; then
  COMPOSE_ENV="$ENV_FILE"
  TEMP_ENV=""
  if [[ ! -f "$COMPOSE_ENV" ]] && [[ -f .env.example ]]; then
    TEMP_ENV="$(mktemp)"
    JWT_TMP="$(openssl rand -base64 32 | tr -d '\n')"
    PG_TMP="$(openssl rand -base64 24 | tr -d '\n')"
    sed "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${PG_TMP}|; s|^JWT_SECRET=.*|JWT_SECRET=${JWT_TMP}|" .env.example > "$TEMP_ENV"
    COMPOSE_ENV="$TEMP_ENV"
    ok "docker-compose.prod.yml — проверка по .env.example (создайте .env для деплоя)"
  fi
  if [[ -f "$COMPOSE_ENV" ]]; then
    if docker compose -f docker-compose.prod.yml --env-file "$COMPOSE_ENV" config -q 2>/dev/null; then
      [[ -z "$TEMP_ENV" ]] && ok "docker-compose.prod.yml валиден"
    else
      warn "docker-compose.prod.yml — ошибка конфигурации"
    fi
  else
    warn "docker compose config — нужен .env или .env.example"
  fi
  [[ -n "$TEMP_ENV" ]] && rm -f "$TEMP_ENV"
else
  warn "docker не найден — установите Docker Desktop для Mac или пропустите этот шаг"
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
  db/migration_manual_cashier_shifts.sql \
  db/migration_manual_product_discount.sql \
  db/migration_manual_sale_payment_split.sql
do
  if [[ -f "web-backend/src/main/resources/$f" ]]; then
    ok "$f"
  else
    warn "Отсутствует web-backend/src/main/resources/$f"
  fi
done

echo ""
if [[ "$ERR" -eq 0 ]]; then
  echo "Готово к деплою: bash deploy/deploy.sh"
  exit 0
fi

echo "Исправьте замечания выше перед выкладкой на прод."
exit 1
