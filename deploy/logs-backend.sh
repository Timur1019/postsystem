#!/usr/bin/env bash
# Последние логи backend (на сервере в /opt/aurent-pos).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail="${1:-150}" backend
