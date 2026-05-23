#!/usr/bin/env bash
# Сборка JAR в контейнере Maven, миграции БД, деплой в running backend.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/web-backend"
JAR="$BACKEND/target/pos-backend-1.0.0.jar"
CONTAINER="${BACKEND_CONTAINER:-masterpiece-pos-backend}"
MAVEN_IMAGE="${MAVEN_IMAGE:-maven:3.9-eclipse-temurin-17}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

echo "==> DB migrations (local)..."
COMPOSE_FILE="$COMPOSE_FILE" ENV_FILE="${ENV_FILE:-$ROOT/.env}" bash "$ROOT/deploy/migrate-db.sh"

echo "==> Maven build in Docker..."
docker run --rm \
  -v "$BACKEND:/app" \
  -w /app \
  "$MAVEN_IMAGE" \
  mvn clean package -DskipTests -q

if [[ ! -f "$JAR" ]]; then
  echo "JAR not found: $JAR" >&2
  exit 1
fi

echo "==> Copy JAR into $CONTAINER..."
docker cp "$JAR" "$CONTAINER:/app/app.jar"

echo "==> Restart backend..."
docker restart "$CONTAINER"

echo "Done. Logs: docker logs -f $CONTAINER"
