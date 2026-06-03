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
if [[ "$(uname -s)" == "Darwin" ]]; then
  SKIP_NATIVE_PRINTER=1 npm ci --omit=optional --silent 2>/dev/null || SKIP_NATIVE_PRINTER=1 npm install --omit=optional
else
  npm ci --silent 2>/dev/null || npm install
fi

echo ""
echo "Готово. Дальше:"
echo "  Mac dev (свежий UI из web-dist):  cd desktop-cashier && POS_EMBEDDED=1 npm run dev"
echo "  Mac dev (через Docker):           FRESH=1 bash scripts/start-cashier-desktop.sh"
echo "  Mac .dmg:                         INCLUDE_WEB_DIST=1 ./scripts/build-cashier.sh"
echo "  Windows:                          scripts\\build-cashier-windows.bat"
