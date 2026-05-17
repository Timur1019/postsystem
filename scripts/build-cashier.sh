#!/usr/bin/env bash
# Сборка установщика Aurent Cashier для кассиров (Mac .dmg / Windows .exe).
#
# Использование:
#   ./scripts/build-cashier.sh
#   SERVER_HOST=111.88.132.126 SERVER_PORT=8080 ./scripts/build-cashier.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${VERSION:-1.0.0}"
SERVER_HOST="${SERVER_HOST:-111.88.132.126}"
SERVER_PORT="${SERVER_PORT:-8080}"
STAGING="$ROOT/dist/Aurent-Cashier-Desktop-${VERSION}"
ZIP="$ROOT/dist/Aurent-Cashier-Desktop-${VERSION}.zip"

echo "==> Сервер по умолчанию в установщике: ${SERVER_HOST}:${SERVER_PORT}"

echo "==> 1/4 Сборка интерфейса кассы..."
cd "$ROOT/web-frontend"
npm ci --silent 2>/dev/null || npm install
VITE_API_URL=/api/v1 npm run build
rm -rf "$ROOT/desktop-cashier/web-dist"
cp -R dist "$ROOT/desktop-cashier/web-dist"

echo "==> 2/4 Адрес сервера в мастере настройки..."
cat > "$ROOT/desktop-cashier/server.default.json" <<EOF
{
  "host": "${SERVER_HOST}",
  "port": "${SERVER_PORT}"
}
EOF

echo "==> 3/4 Сборка Aurent Cashier (electron-builder)..."
cd "$ROOT/desktop-cashier"
npm ci --silent 2>/dev/null || npm install
rm -f release/*.dmg release/*.exe release/*.blockmap 2>/dev/null || true

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  npm run dist:mac
elif [[ "$OS" == MINGW* || "$OS" == MSYS* || "$OS" == CYGWIN* ]]; then
  npm run dist:win
else
  npm run dist:mac 2>/dev/null || npm run dist:win 2>/dev/null || true
fi

echo "==> 4/4 Упаковка ZIP для раздачи кассирам..."
rm -rf "$STAGING"
mkdir -p "$STAGING/mac" "$STAGING/windows"

cp "$ROOT/installer/ДЛЯ-КАССИРА.txt" "$STAGING/"
cp "$ROOT/installer/INSTALL.txt" "$STAGING/"
cp "$ROOT/installer/config.example.json" "$STAGING/"
cp "$ROOT/installer/Настройка-сервера-Mac.command" "$STAGING/"
cp "$ROOT/installer/Настройка-сервера-Windows.bat" "$STAGING/"
chmod +x "$STAGING/Настройка-сервера-Mac.command"

# Подставить IP сервера в пример config
sed "s/192.168.1.50/${SERVER_HOST}/g" "$ROOT/installer/config.example.json" > "$STAGING/config.example.json"

shopt -s nullglob
for dmg in "$ROOT/desktop-cashier/release/"*.dmg; do
  cp "$dmg" "$STAGING/mac/"
done
for exe in "$ROOT/desktop-cashier/release/"*.exe; do
  cp "$exe" "$STAGING/windows/"
done

rm -f "$ZIP"
(cd "$ROOT/dist" && zip -r -q "Aurent-Cashier-Desktop-${VERSION}.zip" "Aurent-Cashier-Desktop-${VERSION}")

echo ""
echo "=============================================="
echo "  Готово для кассиров"
echo "=============================================="
echo "  ZIP:    $ZIP"
du -h "$ZIP" 2>/dev/null || true
echo ""
echo "  Сервер: http://${SERVER_HOST}:${SERVER_PORT}"
echo "  Health: http://${SERVER_HOST}:${SERVER_PORT}/api/v1/actuator/health"
echo ""
echo "  Раздайте ZIP → кассир читает ДЛЯ-КАССИРА.txt"
echo "  Mac:     mac/*.dmg"
echo "  Windows: windows/*Setup*.exe (собирается только на Windows)"
echo "=============================================="
