#!/usr/bin/env bash
# Показать типы колонок количества и последнюю ошибку backend (на сервере).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
PG_USER="${POSTGRES_USER:-pos_user}"
PG_DB="${POSTGRES_DB:-pos_db}"

compose() {
  if [[ -f "$ENV_FILE" ]]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker compose -f "$COMPOSE_FILE" "$@"
  fi
}

echo "==> Backend (последние 40 строк)"
compose logs --tail=40 backend 2>/dev/null || true

echo ""
echo "==> Колонки количества (ожидается numeric / есть sale_type)"
compose exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 <<'SQL'
SELECT table_name, column_name, data_type,
       numeric_precision, numeric_scale, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'products' AND column_name IN (
        'stock_quantity', 'sale_type', 'unit_code', 'quantity_scale', 'allow_fraction'))
    OR (table_name = 'store_stock' AND column_name = 'quantity')
    OR (table_name = 'sale_items' AND column_name IN ('quantity', 'returned_quantity'))
    OR (table_name = 'stock_movements' AND column_name = 'quantity')
    OR (table_name = 'stock_receipt_lines' AND column_name = 'quantity')
    OR (table_name = 'stock_transfer_lines' AND column_name = 'quantity')
    OR (table_name = 'stock_transfers' AND column_name = 'total_quantity')
    OR (table_name = 'stock_receipts' AND column_name = 'total_quantity')
    OR (table_name = 'stock_inventories' AND column_name = 'total_difference')
    OR (table_name = 'stock_inventory_lines' AND column_name IN (
        'system_quantity', 'counted_quantity', 'difference'))
  )
ORDER BY table_name, column_name;
SQL
