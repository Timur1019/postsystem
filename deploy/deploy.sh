#!/usr/bin/env bash
# Сборка и запуск production-стека на сервере.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет файла $ENV_FILE — скопируйте: cp .env.example .env && отредактируйте пароли."
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [[ "${JWT_SECRET:-}" == *"CHANGE_ME"* ]] || [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "Ошибка: задайте JWT_SECRET в .env (минимум 32 символа)."
  exit 1
fi

if [[ "${POSTGRES_PASSWORD:-}" == *"CHANGE_ME"* ]]; then
  echo "Ошибка: задайте POSTGRES_PASSWORD в .env."
  exit 1
fi

echo "==> Сборка образов ($COMPOSE_FILE)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --pull

echo "==> Запуск PostgreSQL..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres

if [[ "${RUN_LEGACY_MIGRATE:-}" == "1" ]]; then
  echo "==> Legacy SQL-миграции (migrate-db.sh)..."
  bash deploy/migrate-db.sh
else
  echo "==> Миграции БД: Liquibase при старте backend (db/changelog/)"
  echo "    (fallback без рестарта: RUN_LEGACY_MIGRATE=1 bash deploy/deploy.sh)"
fi

echo "==> Проверка пароля БД..."
if ! bash deploy/verify-db.sh; then
  exit 1
fi

echo "==> Запуск backend..."
if ! docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps backend; then
  echo "==> Ошибка запуска backend. Последние логи:"
  docker compose -f "$COMPOSE_FILE" logs --tail=120 backend || true
  exit 1
fi

echo "==> Ожидание health backend (до ~3 мин)..."
backend_ok=0
for _ in $(seq 1 36); do
  if docker compose -f "$COMPOSE_FILE" exec -T backend \
    curl -fsS http://127.0.0.1:8080/api/v1/actuator/health 2>/dev/null | grep -q UP; then
    backend_ok=1
    break
  fi
  sleep 5
done

if [[ "$backend_ok" != "1" ]]; then
  echo "==> Backend не поднялся. Логи:"
  docker compose -f "$COMPOSE_FILE" logs --tail=150 backend || true
  exit 1
fi

echo "==> Запуск frontend..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d frontend

if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "==> Запуск Telegram-бота поддержки..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build telegram-support-bot
else
  echo "==> TELEGRAM_BOT_TOKEN не задан — бот поддержки пропущен."
fi

echo ""
echo "==> Статус контейнеров:"
docker compose -f "$COMPOSE_FILE" ps

SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo ""
echo "Проверка:"
echo "  Web:    http://${SERVER_IP:-localhost}:${HTTP_PORT:-80}/"
echo "  API:    http://${SERVER_IP:-localhost}:${API_PORT:-8080}/api/v1/actuator/health"
echo "  Логи:   docker compose -f $COMPOSE_FILE logs -f backend"
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "  Бот:    docker compose -f $COMPOSE_FILE logs -f telegram-support-bot"
fi
