#!/usr/bin/env bash
# Устанавливает ежедневный бэкап БД в 03:00 (Asia/Tashkent на сервере).
# Использование: sudo bash deploy/install-backup-cron.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRON_LINE="0 3 * * * cd $ROOT && /usr/bin/bash deploy/backup-db.sh >> $ROOT/backups/postgres/backup.log 2>&1"

mkdir -p "$ROOT/backups/postgres"

TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v 'deploy/backup-db.sh' >"$TMP" || true
echo "$CRON_LINE" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "==> Cron установлен:"
crontab -l | grep backup-db.sh
echo ""
echo "Проверка вручную: bash deploy/backup-db.sh"
echo "Логи cron: $ROOT/backups/postgres/backup.log"
