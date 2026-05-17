#!/usr/bin/env bash
# Подготовка чистого Ubuntu 22.04/24.04 для Aurent POS (запуск от root на сервере).
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Запустите: sudo bash deploy/ubuntu-prepare.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Обновление пакетов..."
apt-get update -qq
apt-get upgrade -y -qq

echo "==> Базовые утилиты..."
apt-get install -y -qq ca-certificates curl git ufw fail2ban

echo "==> Docker (official)..."
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable docker
systemctl start docker

echo "==> Firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp comment 'Aurent web'
ufw allow 8080/tcp comment 'Aurent API (касса)'
ufw --force enable

echo "==> Каталог приложения..."
mkdir -p /opt/aurent-pos
chown -R "${SUDO_USER:-root}:${SUDO_USER:-root}" /opt/aurent-pos 2>/dev/null || true

echo ""
echo "Готово."
echo "  Docker: $(docker --version)"
echo "  Compose: $(docker compose version)"
echo ""
echo "Дальше:"
echo "  1) Скопируйте проект в /opt/aurent-pos (git clone или scp)"
echo "  2) cd /opt/aurent-pos && cp .env.example .env && nano .env"
echo "  3) bash deploy/deploy.sh"
