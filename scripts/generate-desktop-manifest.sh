#!/usr/bin/env bash
# Генерирует downloads/desktop/manifest.json по файлам в каталоге.
# Работает без Node (python3 или grep) — для Ubuntu-сервера.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:-$ROOT/downloads/desktop}"
RELEASED_AT="${RELEASED_AT:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

read_version() {
  local pkg="$ROOT/desktop-cashier/package.json"
  if [[ -f "$pkg" ]]; then
    if command -v node >/dev/null 2>&1; then
      node -p "require('$pkg').version"
      return
    fi
    if command -v python3 >/dev/null 2>&1; then
      python3 -c "import json; print(json.load(open('$pkg'))['version'])"
      return
    fi
    grep -m1 '"version"' "$pkg" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/'
    return
  fi
  echo "1.0.0"
}

VERSION="${VERSION:-$(read_version)}"

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

find_first() {
  local pattern="$1"
  shopt -s nullglob
  local files=("$DIR"/$pattern)
  shopt -u nullglob
  if [[ ${#files[@]} -eq 0 ]]; then
    echo ""
  else
    echo "${files[0]}"
  fi
}

python3 - "$DIR/manifest.json" "$VERSION" "$RELEASED_AT" <<'PY'
import json
import os
import sys
from datetime import datetime

out_path, version, released_at = sys.argv[1:4]
base_dir = os.path.dirname(out_path)

def sha256(path):
    import hashlib
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def entry(pattern):
    import glob
    matches = sorted(glob.glob(os.path.join(base_dir, pattern)))
    if not matches:
        return None
    path = matches[0]
    name = os.path.basename(path)
    return {
        "url": f"/downloads/desktop/{name}",
        "fileName": name,
        "size": os.path.getsize(path),
        "sha256": sha256(path),
    }

manifest = {
    "version": version,
    "releasedAt": released_at,
    "windows": entry("*Setup*.exe"),
    "mac": entry("*.dmg"),
    "zip": entry("Aurent-Cashier-Desktop-*.zip") or entry("Aurent-Cashier-Windows-portable-*.zip"),
}

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"manifest.json -> {out_path}")
PY

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
