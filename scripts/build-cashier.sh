#!/usr/bin/env bash
# Сборка установщика Aurent Cashier для кассиров (Mac .dmg / Windows .exe).
#
# По умолчанию установщик — «тонкий клиент»: UI грузится с сервера (порт 80).
# Встроенный web-dist только для офлайн/dev: INCLUDE_WEB_DIST=1 ./scripts/build-cashier.sh
#
# Использование:
#   ./scripts/build-cashier.sh
#   SERVER_HOST=111.88.132.126 ./scripts/build-cashier.sh
#   INCLUDE_WEB_DIST=1 ./scripts/build-cashier.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${VERSION:-1.0.0}"
SERVER_HOST="${SERVER_HOST:-111.88.132.126}"
SERVER_WEB_PORT="${SERVER_WEB_PORT:-80}"
SERVER_API_PORT="${SERVER_API_PORT:-8080}"
INCLUDE_WEB_DIST="${INCLUDE_WEB_DIST:-0}"
STAGING="$ROOT/dist/Aurent-Cashier-Desktop-${VERSION}"
ZIP="$ROOT/dist/Aurent-Cashier-Desktop-${VERSION}.zip"

echo "==> Сервер по умолчанию: веб http://${SERVER_HOST}:${SERVER_WEB_PORT}/, API :${SERVER_API_PORT}"
echo "==> Режим: $([ "$INCLUDE_WEB_DIST" = "1" ] && echo 'встроенный UI (web-dist)' || echo 'тонкий клиент (UI с сервера)')"

STEP=1
if [ "$INCLUDE_WEB_DIST" = "1" ]; then
  echo "==> ${STEP}/4 Сборка встроенного интерфейса (web-dist)..."
  cd "$ROOT/web-frontend"
  npm ci --silent 2>/dev/null || npm install
  VITE_API_URL=/api/v1 npm run build
  rm -rf "$ROOT/desktop-cashier/web-dist"
  cp -R dist "$ROOT/desktop-cashier/web-dist"
  STEP=$((STEP + 1))
else
  echo "==> Пропуск web-dist (касса загрузит UI с http://${SERVER_HOST}:${SERVER_WEB_PORT}/)"
  rm -rf "$ROOT/desktop-cashier/web-dist"
fi

echo "==> ${STEP}/4 Адрес сервера в мастере настройки..."
cat > "$ROOT/desktop-cashier/server.default.json" <<EOF
{
  "host": "${SERVER_HOST}",
  "webPort": "${SERVER_WEB_PORT}",
  "apiPort": "${SERVER_API_PORT}"
}
EOF
STEP=$((STEP + 1))

echo "==> ${STEP}/4 Сборка Aurent Cashier (electron-builder)..."
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
STEP=$((STEP + 1))

echo "==> ${STEP}/4 Упаковка ZIP для раздачи кассирам..."
rm -rf "$STAGING"
mkdir -p "$STAGING/mac" "$STAGING/windows"

cp "$ROOT/installer/ДЛЯ-КАССИРА.txt" "$STAGING/"
cp "$ROOT/installer/INSTALL.txt" "$STAGING/"
cp "$ROOT/installer/config.example.json" "$STAGING/"
cp "$ROOT/installer/Настройка-сервера-Mac.command" "$STAGING/"
cp "$ROOT/installer/Настройка-сервера-Windows.bat" "$STAGING/"
chmod +x "$STAGING/Настройка-сервера-Mac.command"

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
echo "  Касса откроет: http://${SERVER_HOST}:${SERVER_WEB_PORT}/login"
echo "  Health (через nginx): http://${SERVER_HOST}:${SERVER_WEB_PORT}/api/v1/actuator/health"
echo ""
echo "  Обновление UI на кассах: bash deploy/git-update.sh на сервере,"
echo "  затем «Вид → Обновить» в приложении (переустановка не нужна)."
echo ""
echo "  Раздайте ZIP → кассир читает ДЛЯ-КАССИРА.txt"
echo "  Mac:     mac/*.dmg"
echo "  Windows: windows/*Setup*x64.exe (только Win10/11, сборка на Windows)"
echo "=============================================="
