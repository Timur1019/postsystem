#!/usr/bin/env bash
# Сборка ZIP для кассиров: только Aurent Cashier + инструкция (бэкенд на вашем сервере)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="1.0.0"
STAGING="$ROOT/dist/Aurent-Cashier-Desktop-${VERSION}"
ZIP="$ROOT/dist/Aurent-Cashier-Desktop-${VERSION}.zip"

echo "==> 1/3 Сборка интерфейса кассы..."
cd "$ROOT/web-frontend"
npm ci --silent 2>/dev/null || npm install
VITE_API_URL=/api/v1 npm run build
rm -rf "$ROOT/desktop-cashier/web-dist"
cp -R dist "$ROOT/desktop-cashier/web-dist"

echo "==> 2/3 Сборка Aurent Cashier..."
cd "$ROOT/desktop-cashier"
npm ci --silent 2>/dev/null || npm install
rm -f release/Masterpiece*.dmg release/Masterpiece*.dmg.blockmap 2>/dev/null || true

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  npm run dist:mac
elif [ "$OS" = "MINGW"* ] || [ "$OS" = "MSYS"* ] || [ "$OS" = "Windows"* ]; then
  npm run dist:win
else
  npm run dist:mac 2>/dev/null || npm run dist:win 2>/dev/null || true
fi

echo "==> 3/3 Упаковка ZIP..."
rm -rf "$STAGING"
mkdir -p "$STAGING/mac" "$STAGING/windows"

cp "$ROOT/installer/INSTALL.txt" "$STAGING/"
cp "$ROOT/installer/КАК-УСТАНОВИТЬ.txt" "$STAGING/"
cp "$ROOT/installer/config.example.json" "$STAGING/"
cp "$ROOT/installer/Настройка-сервера-Mac.command" "$STAGING/"
cp "$ROOT/installer/Настройка-сервера-Windows.bat" "$STAGING/"
chmod +x "$STAGING/Настройка-сервера-Mac.command"

shopt -s nullglob
for dmg in "$ROOT/desktop-cashier/release/Aurent"*.dmg; do
  cp "$dmg" "$STAGING/mac/"
done
for exe in "$ROOT/desktop-cashier/release/Aurent"*.exe; do
  cp "$exe" "$STAGING/windows/"
done

rm -f "$ZIP"
(cd "$ROOT/dist" && zip -r -q "Aurent-Cashier-Desktop-${VERSION}.zip" "Aurent-Cashier-Desktop-${VERSION}")

echo ""
echo "Готово: $ZIP"
du -h "$ZIP"
