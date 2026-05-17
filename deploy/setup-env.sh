#!/usr/bin/env bash
# Создаёт .env из .env.example с случайными секретами (Mac или сервер).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  echo ".env уже существует — не перезаписываю."
  echo "Удалите вручную, если нужен новый: rm .env && bash deploy/setup-env.sh"
  exit 0
fi

if [[ ! -f .env.example ]]; then
  echo "Нет .env.example"
  exit 1
fi

JWT_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '\n')"

cp .env.example .env

# macOS и Linux sed
if sed --version >/dev/null 2>&1; then
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
else
  sed -i '' "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
  sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
fi

echo "Создан .env с новыми секретами."
echo "  POSTGRES_PASSWORD — сохранён в .env"
echo "  JWT_SECRET        — сохранён в .env"
echo ""
echo "На сервере используйте тот же .env или создайте заново: bash deploy/setup-env.sh"
echo "Дальше: bash deploy/prod-check.sh"
