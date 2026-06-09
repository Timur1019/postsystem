#!/usr/bin/env bash
# Сборка desktop-релиза Aurent Cashier + manifest для /install и auto-update.
#
# PLATFORM=mac|win|auto   — целевая ОС (auto = текущая)
# PACKAGE_ZIP=1           — упаковать dist/Aurent-Cashier-Desktop-VERSION.zip
# COPY_TO_DOWNLOADS=1   — скопировать артефакты в downloads/desktop/
# INCLUDE_WEB_DIST=0      — тонкий клиент (prod по умолчанию)
#
# Примеры:
#   PLATFORM=mac COPY_TO_DOWNLOADS=1 ./scripts/build-desktop-release.sh
#   PLATFORM=win PACKAGE_ZIP=1 ./scripts/build-desktop-release.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

read_version() {
  local pkg="$ROOT/desktop-cashier/package.json"
  if [[ ! -f "$pkg" ]]; then
    echo "1.0.0"
    return
  fi
  if command -v python3 >/dev/null 2>&1; then
    python3 -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['version'])" "$pkg"
    return
  fi
  if command -v node >/dev/null 2>&1; then
    (cd "$ROOT/desktop-cashier" && node -p "require('./package.json').version")
    return
  fi
  grep -m1 '"version"' "$pkg" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/'
}

VERSION="${VERSION:-$(read_version)}"
SERVER_HOST="${SERVER_HOST:-111.88.132.126}"
SERVER_WEB_PORT="${SERVER_WEB_PORT:-8081}"
SERVER_API_PORT="${SERVER_API_PORT:-8081}"
INCLUDE_WEB_DIST="${INCLUDE_WEB_DIST:-1}"
PLATFORM="${PLATFORM:-auto}"
PACKAGE_ZIP="${PACKAGE_ZIP:-0}"
COPY_TO_DOWNLOADS="${COPY_TO_DOWNLOADS:-0}"
UPDATE_URL="${DESKTOP_UPDATE_URL:-http://${SERVER_HOST}/downloads/desktop/}"

DOWNLOADS_DIR="$ROOT/downloads/desktop"
STAGING="$ROOT/dist/Aurent-Cashier-Desktop-${VERSION}"
ZIP="$ROOT/dist/Aurent-Cashier-Desktop-${VERSION}.zip"

detect_platform() {
  if [[ "$PLATFORM" != "auto" ]]; then
    echo "$PLATFORM"
    return
  fi
  local os
  os="$(uname -s)"
  if [[ "$os" == "Darwin" ]]; then
    echo "mac"
  elif [[ "$os" == MINGW* || "$os" == MSYS* || "$os" == CYGWIN* ]]; then
    echo "win"
  else
    echo "mac"
  fi
}

TARGET="$(detect_platform)"

echo "==> Aurent Desktop release v${VERSION}"
echo "    Platform: ${TARGET}"
echo "    Server:   http://${SERVER_HOST}:${SERVER_WEB_PORT}/"
echo "    Mode:     $([ "$INCLUDE_WEB_DIST" = "1" ] && echo 'embedded UI' || echo 'thin client')"
echo "    Update:   ${UPDATE_URL}"

if [[ "$INCLUDE_WEB_DIST" = "1" ]]; then
  echo "==> Сборка web-dist..."
  cd "$ROOT/web-frontend"
  npm ci --silent 2>/dev/null || npm install
  VITE_API_URL=/api/v1 npm run build
  rm -rf "$ROOT/desktop-cashier/web-dist"
  cp -R dist "$ROOT/desktop-cashier/web-dist"
else
  rm -rf "$ROOT/desktop-cashier/web-dist"
fi

cat > "$ROOT/desktop-cashier/server.default.json" <<EOF
{
  "host": "${SERVER_HOST}",
  "webPort": "${SERVER_WEB_PORT}",
  "apiPort": "${SERVER_API_PORT}"
}
EOF

export DESKTOP_UPDATE_URL="$UPDATE_URL"

echo "==> electron-builder (${TARGET})..."
cd "$ROOT/desktop-cashier"

if [[ "$TARGET" == "mac" ]]; then
  echo "==> npm ci (Mac: без сборки native-принтера, optional @thiagoelg/node-printer может не собраться)..."
  SKIP_NATIVE_PRINTER=1 npm ci --silent 2>/dev/null || SKIP_NATIVE_PRINTER=1 npm install
elif [[ "$TARGET" == "win" ]]; then
  echo "==> npm ci + native printer (Electron)..."
  npm ci --silent 2>/dev/null || npm install
  echo "==> Native printer driver (Electron)..."
  npm run rebuild:native
else
  npm ci --silent 2>/dev/null || npm install
fi

echo "==> App icons (Aurent brand)..."
npm run icons

case "$TARGET" in
  mac)
    npm run dist:mac
    ;;
  win)
    rm -rf "${LOCALAPPDATA:-}/electron-builder/Cache/winCodeSign" 2>/dev/null || true
    export CSC_IDENTITY_AUTO_DISCOVERY="${CSC_IDENTITY_AUTO_DISCOVERY:-false}"
    if npm run dist:win; then
      echo "==> Windows NSIS installer OK"
      if [[ -d "$ROOT/desktop-cashier/release/win-unpacked" ]]; then
        node "$ROOT/desktop-cashier/scripts/verify-windows-unpacked.cjs" || true
      fi
    else
      echo "==> NSIS failed — portable ZIP (win-unpacked)..."
      npm run dist:win:dir
      UNPACKED="$ROOT/desktop-cashier/release/win-unpacked"
      PORTABLE="$ROOT/downloads/desktop/Aurent-Cashier-Windows-portable-${VERSION}.zip"
      mkdir -p "$ROOT/downloads/desktop"
      if [[ ! -d "$UNPACKED" ]]; then
        echo "Ошибка: нет win-unpacked" >&2
        exit 1
      fi
      if command -v zip >/dev/null 2>&1; then
        (cd "$UNPACKED" && zip -r -q "$PORTABLE" .)
      else
        powershell.exe -NoProfile -Command "Compress-Archive -Path '$UNPACKED/*' -DestinationPath '$PORTABLE' -Force"
      fi
      echo "==> Portable: $PORTABLE"
    fi
    ;;
  *)
    echo "Unknown PLATFORM: $TARGET" >&2
    exit 1
    ;;
esac

if [[ "$COPY_TO_DOWNLOADS" = "1" ]]; then
  mkdir -p "$DOWNLOADS_DIR"
  shopt -s nullglob
  for dmg in "$ROOT/desktop-cashier/release/"*.dmg; do
    cp "$dmg" "$DOWNLOADS_DIR/"
  done
  for exe in "$ROOT/desktop-cashier/release/"*.exe; do
    cp "$exe" "$DOWNLOADS_DIR/"
  done
  for yml in "$ROOT/desktop-cashier/release/latest"*.yml; do
    cp "$yml" "$DOWNLOADS_DIR/"
  done
  shopt -u nullglob
  bash "$ROOT/scripts/generate-desktop-manifest.sh" "$DOWNLOADS_DIR"
fi

if [[ "$PACKAGE_ZIP" = "1" ]]; then
  echo "==> ZIP для кассиров..."
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
  shopt -u nullglob

  rm -f "$ZIP"
  mkdir -p "$ROOT/dist"
  (cd "$ROOT/dist" && zip -r -q "Aurent-Cashier-Desktop-${VERSION}.zip" "Aurent-Cashier-Desktop-${VERSION}")

  if [[ "$COPY_TO_DOWNLOADS" = "1" && -f "$ZIP" ]]; then
    cp "$ZIP" "$DOWNLOADS_DIR/"
    bash "$ROOT/scripts/generate-desktop-manifest.sh" "$DOWNLOADS_DIR"
  fi

  echo "  ZIP: $ZIP"
fi

echo ""
echo "=============================================="
echo "  Desktop release готов (v${VERSION})"
echo "=============================================="
echo "  Страница:  http://${SERVER_HOST}/install"
echo "  Downloads: http://${SERVER_HOST}/downloads/desktop/manifest.json"
if [[ "$COPY_TO_DOWNLOADS" = "1" ]]; then
  echo "  Локально:  $DOWNLOADS_DIR/"
fi
echo "=============================================="
