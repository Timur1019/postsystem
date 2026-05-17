#!/usr/bin/env bash
# Один раз на сервере: привязать /opt/aurent-pos к GitHub (сохраняет .env).
# Использование: bash deploy/git-bootstrap.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Timur1019/postsystem.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/aurent-pos}"

if [[ "${EUID}" -ne 0 ]] && [[ ! -w "$APP_DIR" ]] 2>/dev/null; then
  echo "Запустите от root или с правами на $APP_DIR:"
  echo "  sudo bash deploy/git-bootstrap.sh"
  exit 1
fi

if [[ -d "$APP_DIR/.git" ]]; then
  echo "Git уже настроен в $APP_DIR"
  cd "$APP_DIR"
  git remote -v
  git branch -vv
  exit 0
fi

ENV_BACKUP=""
if [[ -f "$APP_DIR/.env" ]]; then
  ENV_BACKUP="$(mktemp)"
  cp "$APP_DIR/.env" "$ENV_BACKUP"
  echo "Сохранён .env → $ENV_BACKUP"
fi

if [[ -d "$APP_DIR" ]] && [[ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]]; then
  STAMP="$(date +%Y%m%d%H%M%S)"
  BACKUP_DIR="${APP_DIR}.rsync-backup-${STAMP}"
  echo "Резервная копия текущей папки → $BACKUP_DIR"
  mv "$APP_DIR" "$BACKUP_DIR"
fi

mkdir -p "$(dirname "$APP_DIR")"
git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"

if [[ -n "$ENV_BACKUP" ]] && [[ -f "$ENV_BACKUP" ]]; then
  cp "$ENV_BACKUP" "$APP_DIR/.env"
  rm -f "$ENV_BACKUP"
  echo "Восстановлен .env"
elif [[ ! -f "$APP_DIR/.env" ]]; then
  echo "Создайте секреты: cd $APP_DIR && bash deploy/setup-env.sh"
fi

cd "$APP_DIR"
chmod +x deploy/*.sh 2>/dev/null || true

echo ""
echo "Готово. Репозиторий: $REPO_URL ($BRANCH)"
echo "Дальше: cd $APP_DIR && bash deploy/prod-check.sh && bash deploy/deploy.sh"
echo "Обновления: bash deploy/git-update.sh"
