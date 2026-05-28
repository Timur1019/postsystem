#!/usr/bin/env bash
# Electron + UI. По умолчанию UI с http://localhost:5173 — это Docker-образ frontend
# (снимок на момент последнего docker compose build), НЕ живой Vite из исходников.
#
# Свежий UI:
#   FRESH=1 bash scripts/start-cashier-desktop.sh   — пересобрать образ frontend
#   bash scripts/prepare-cashier-desktop.sh && cd desktop-cashier && POS_EMBEDDED=1 npm run dev
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ "${FRESH:-0}" = "1" ]; then
  echo "==> Пересборка frontend (актуальный код из web-frontend)..."
  docker compose -f "$ROOT/docker-compose.yml" build frontend
  docker compose -f "$ROOT/docker-compose.yml" up -d frontend
fi

if ! curl -sf "http://localhost:5173/" >/dev/null 2>&1; then
  echo "Frontend не запущен. Сначала: cd \"$ROOT\" && docker compose up -d"
  exit 1
fi

if ! curl -sf "http://localhost:8080/api/v1/actuator/health" >/dev/null 2>&1; then
  echo "Backend не запущен. Сначала: cd \"$ROOT\" && docker compose up -d"
  exit 1
fi

cd "$ROOT/desktop-cashier"
if [ ! -d node_modules ]; then
  npm install
fi
POS_REMOTE_UI=1 POS_CASHIER_URL=http://localhost:5173 npm start
