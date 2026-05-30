#!/bin/bash
CONFIG_DIR="$HOME/Library/Application Support/masterpiece-pos-cashier-desktop"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo ""
echo "=== Aurent Cashier — адрес сервера ==="
echo ""
read -r -p "IP или домен сервера [111.88.132.126]: " HOST
read -r -p "Порт сайта и API [8081]: " PORT
HOST="${HOST:-111.88.132.126}"
PORT="${PORT:-8081}"

HOST="${HOST#http://}"
HOST="${HOST#https://}"
HOST="${HOST%%/*}"

ORIGIN="http://${HOST}:${PORT}"
HEALTH="${ORIGIN}/api/v1/actuator/health"
if [[ "$PORT" == "443" ]]; then
  ORIGIN="https://${HOST}"
  HEALTH="https://${HOST}/api/v1/actuator/health"
elif [[ "$PORT" == "8443" ]]; then
  ORIGIN="https://${HOST}:8443"
  HEALTH="https://${HOST}:8443/api/v1/actuator/health"
elif [[ "$PORT" == "80" ]]; then
  ORIGIN="http://${HOST}"
  HEALTH="http://${HOST}/api/v1/actuator/health"
fi

mkdir -p "$CONFIG_DIR"
cat > "$CONFIG_FILE" <<EOF
{
  "useRemoteUi": false,
  "cashierUrl": "http://127.0.0.1:5199",
  "backendOrigin": "${ORIGIN}",
  "apiHealthUrl": "${HEALTH}",
  "webPort": "${PORT}",
  "apiPort": "${PORT}",
  "embeddedPort": 5199
}
EOF

echo ""
echo "Сохранено: $CONFIG_FILE"
echo "Сервер: ${ORIGIN}"
echo "Проверка в браузере: ${HEALTH}"
echo "  Должно быть: {\"status\":\"UP\"}"
echo ""
echo "Закройте Aurent Cashier полностью и откройте снова."
read -r -p "Enter для закрытия..."
