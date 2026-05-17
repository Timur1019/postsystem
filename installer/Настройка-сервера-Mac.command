#!/bin/bash
CONFIG_DIR="$HOME/Library/Application Support/masterpiece-pos-cashier-desktop"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo ""
echo "=== Aurent Cashier — адрес сервера ==="
echo ""
read -r -p "IP или домен сервера (например 192.168.1.50): " HOST
read -r -p "Порт API [8080]: " PORT
PORT="${PORT:-8080}"

HOST="${HOST#http://}"
HOST="${HOST#https://}"
HOST="${HOST%%/*}"

mkdir -p "$CONFIG_DIR"
cat > "$CONFIG_FILE" <<EOF
{
  "backendOrigin": "http://${HOST}:${PORT}",
  "apiHealthUrl": "http://${HOST}:${PORT}/api/v1/actuator/health"
}
EOF

echo ""
echo "Сохранено: $CONFIG_FILE"
echo "Backend: http://${HOST}:${PORT}"
echo ""
echo "Теперь откройте «Aurent Cashier»."
read -r -p "Enter для закрытия..."
