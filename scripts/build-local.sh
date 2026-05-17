#!/usr/bin/env bash
# Локальная сборка как в Docker (Maven + MapStruct + Vite).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Backend (Maven)..."
cd "$ROOT"
mvn -q clean package -DskipTests -pl web-backend -am

echo "==> Frontend (Vite)..."
cd "$ROOT/web-frontend"
npm ci --silent 2>/dev/null || npm install --silent
npm run build

echo ""
echo "OK: backend JAR -> web-backend/target/*.jar"
echo "OK: frontend     -> web-frontend/dist/"
