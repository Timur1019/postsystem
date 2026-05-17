#!/usr/bin/env bash
# Копирование проекта на Ubuntu-сервер (с Mac/Linux разработки).
# Использование: ./deploy/sync-to-server.sh root@192.168.1.100
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Использование: $0 user@server-ip"
  echo "Пример:       $0 root@192.168.60.10"
  exit 1
fi

TARGET="$1"
REMOTE_DIR="/opt/aurent-pos"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Rsync -> ${TARGET}:${REMOTE_DIR}"
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'target' \
  --exclude 'dist' \
  --exclude 'desktop-cashier/node_modules' \
  --exclude 'desktop-cashier/release' \
  --exclude '.env' \
  --exclude 'logs' \
  --exclude 'uploads' \
  "$ROOT/" "${TARGET}:${REMOTE_DIR}/"

echo ""
echo "На сервере выполните:"
echo "  ssh ${TARGET}"
echo "  cd ${REMOTE_DIR} && cp -n .env.example .env 2>/dev/null || true"
echo "  nano .env"
echo "  bash deploy/deploy.sh"
