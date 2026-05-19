#!/usr/bin/env bash
# Обновление production с Mac/Linux: SSH на сервер → git pull → docker rebuild.
# Использование: bash deploy/remote-update.sh [user@host]
# Пример:       bash deploy/remote-update.sh root@111.88.132.126
# Путь на сервере: REMOTE_DIR=/root/aurent-pos bash deploy/remote-update.sh ...
set -euo pipefail

TARGET="${1:-root@111.88.132.126}"
REMOTE_DIR="${REMOTE_DIR:-}"

echo "==> Деплой на ${TARGET}"

ssh -t "$TARGET" bash -s <<EOF
set -euo pipefail

APP_DIR="${REMOTE_DIR}"
if [[ -z "\$APP_DIR" ]]; then
  for candidate in /opt/aurent-pos /root/aurent-pos ~/aurent-pos; do
    if [[ -d "\$candidate/.git" ]]; then
      APP_DIR="\$candidate"
      break
    fi
  done
fi

if [[ -z "\$APP_DIR" || ! -d "\$APP_DIR/.git" ]]; then
  echo "Не найден git-репозиторий. Задайте: REMOTE_DIR=/path bash deploy/remote-update.sh ..."
  exit 1
fi

echo "==> Папка на сервере: \$APP_DIR"
cd "\$APP_DIR"

if [[ ! -f .env ]]; then
  echo "Нет .env — создайте: bash deploy/setup-env.sh"
  exit 1
fi

if ! grep -q '^VITE_SUPPORT_TELEGRAM_BOT=' .env 2>/dev/null; then
  echo "VITE_SUPPORT_TELEGRAM_BOT=in_you_bot" >> .env
  echo "==> Добавлен VITE_SUPPORT_TELEGRAM_BOT в .env"
fi

git fetch origin
git checkout -f main
git reset --hard origin/main
git clean -fd

COMMIT="\$(git rev-parse --short HEAD)"
echo "==> Код на сервере: \$COMMIT"

chmod +x deploy/*.sh 2>/dev/null || true
bash deploy/deploy.sh
EOF

echo ""
echo "==> Проверка с вашего ПК:"
HEALTH_HOST="${TARGET#*@}"
HEALTH_URL="http://${HEALTH_HOST}/api/v1/actuator/health"
if curl -sf "$HEALTH_URL"; then echo ""; else echo "Проверьте вручную: $HEALTH_URL"; fi
