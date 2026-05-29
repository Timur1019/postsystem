#!/usr/bin/env bash
# Обёртка: сборка установщика для текущей ОС + ZIP для кассиров.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PLATFORM="${PLATFORM:-auto}"
export PACKAGE_ZIP="${PACKAGE_ZIP:-1}"
export COPY_TO_DOWNLOADS="${COPY_TO_DOWNLOADS:-0}"

exec bash "$ROOT/scripts/build-desktop-release.sh"
