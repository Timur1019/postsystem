#!/usr/bin/env bash
# Быстрое восстановление production после падения backend.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет $ENV_FILE"
  exit 1
fi

echo "==> 1. Синхронизация пароля БД с .env"
bash deploy/sync-db-password.sh

echo ""
echo "==> 2. Пересоздание backend"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate --no-deps backend

echo ""
echo "==> 3. Ожидание health (до 3 мин)..."
for i in $(seq 1 36); do
  if docker compose -f "$COMPOSE_FILE" exec -T backend \
    curl -fsS http://127.0.0.1:8080/api/v1/actuator/health 2>/dev/null | grep -q UP; then
    echo "Backend UP"
    break
  fi
  if [[ "$i" -eq 36 ]]; then
    echo "Backend не поднялся. Логи:"
    docker compose -f "$COMPOSE_FILE" logs --tail=80 backend
    exit 1
  fi
  sleep 5
done

echo ""
echo "==> 4. Запуск frontend"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d frontend

echo ""
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo "Проверка: curl -s http://127.0.0.1:8080/api/v1/actuator/health"
