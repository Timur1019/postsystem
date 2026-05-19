#!/usr/bin/env bash
# Сборка web-dist + зависимости Electron (без .exe — его собирают на Windows).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Frontend (web-dist для кассы)..."
cd "$ROOT/web-frontend"
npm ci --silent 2>/dev/null || npm install
VITE_API_URL=/api/v1 npm run build
rm -rf "$ROOT/desktop-cashier/web-dist"
cp -R dist "$ROOT/desktop-cashier/web-dist"

echo "==> Electron dependencies..."
cd "$ROOT/desktop-cashier"
npm ci --silent 2>/dev/null || npm install

echo ""
echo "Готово. Дальше:"
echo "  Mac dev:    cd desktop-cashier && POS_EMBEDDED=1 npm start"
echo "  Windows:    scripts\\build-cashier-windows.bat  (на ПК с Win10/11)"
echo "  Тонкий UI:  INCLUDE_WEB_DIST=0 scripts\\build-cashier-windows.bat"
