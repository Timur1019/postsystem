#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

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
# UI с Vite (последние изменения без пересборки web-dist)
POS_REMOTE_UI=1 POS_CASHIER_URL=http://localhost:5173 npm start
