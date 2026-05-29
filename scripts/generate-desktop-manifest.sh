#!/usr/bin/env bash
# Генерирует downloads/desktop/manifest.json по файлам в каталоге.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:-$ROOT/downloads/desktop}"
VERSION="${VERSION:-$(node -p "require('$ROOT/desktop-cashier/package.json').version")}"
RELEASED_AT="${RELEASED_AT:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

if [[ ! -d "$DIR" ]]; then
  echo "Нет каталога: $DIR" >&2
  exit 1
fi

sha256_of() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    echo ""
  fi
}

file_entry() {
  local pattern="$1"
  local shopt_was=""
  shopt -q nullglob && shopt_was=1 || true
  shopt -s nullglob
  local files=("$DIR"/$pattern)
  [[ -n "$shopt_was" ]] || shopt -u nullglob

  if [[ ${#files[@]} -eq 0 ]]; then
    echo "null"
    return
  fi
  local f="${files[0]}"
  local base
  base="$(basename "$f")"
  local size
  size="$(wc -c <"$f" | tr -d ' ')"
  local hash
  hash="$(sha256_of "$f")"
  node -e "
const entry = {
  url: '/downloads/desktop/${base}',
  fileName: '${base}',
  size: ${size},
  sha256: '${hash}',
};
console.log(JSON.stringify(entry));
"
}

WIN_JSON="$(file_entry '*Setup*.exe')"
MAC_JSON="$(file_entry '*.dmg')"
ZIP_JSON="$(file_entry 'Aurent-Cashier-Desktop-*.zip')"

node -e "
const manifest = {
  version: '${VERSION}',
  releasedAt: '${RELEASED_AT}',
  windows: ${WIN_JSON},
  mac: ${MAC_JSON},
  zip: ${ZIP_JSON},
};
const out = process.argv[1];
require('fs').writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log('manifest.json ->', out);
" "$DIR/manifest.json"

# Копируем yml для electron-updater, если есть в release
RELEASE="$ROOT/desktop-cashier/release"
for yml in latest.yml latest-mac.yml; do
  if [[ -f "$RELEASE/$yml" ]]; then
    cp "$RELEASE/$yml" "$DIR/$yml"
    echo "  $yml"
  fi
done

# Инструкция для кассиров
if [[ -f "$ROOT/installer/ДЛЯ-КАССИРА.txt" ]]; then
  cp "$ROOT/installer/ДЛЯ-КАССИРА.txt" "$DIR/"
fi

echo "OK: $DIR/manifest.json (v${VERSION})"
