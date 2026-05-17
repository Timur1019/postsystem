#!/usr/bin/env bash
# Обновление с GitHub + пересборка Docker (на сервере после merge в main).
# Использование: bash deploy/git-update.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"

if [[ ! -d .git ]]; then
  echo "Папка не является git-репозиторием."
  echo "Один раз: bash deploy/git-bootstrap.sh"
  exit 1
fi

if [[ -f .env ]]; then
  echo "==> .env сохранён (не трогаем)"
else
  echo "Нет .env — создайте: bash deploy/setup-env.sh"
  exit 1
fi

echo "==> git fetch $REMOTE"
git fetch "$REMOTE"

echo "==> git checkout $BRANCH"
git checkout "$BRANCH"

echo "==> git pull --ff-only $REMOTE $BRANCH"
git pull --ff-only "$REMOTE" "$BRANCH"

COMMIT="$(git rev-parse --short HEAD)"
echo "==> Код обновлён до $COMMIT"

chmod +x deploy/*.sh 2>/dev/null || true

bash deploy/deploy.sh
