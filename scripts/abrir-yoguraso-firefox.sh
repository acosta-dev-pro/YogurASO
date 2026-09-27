#!/bin/bash
# YogurASO — montar, desplegar Docker y abrir Firefox (Ubuntu VM)
set -e
PASS="${AA5_PASS:-ubuntu123}"

echo "$PASS" | sudo -S modprobe vboxsf 2>/dev/null || true
echo "$PASS" | sudo -S mkdir -p /mnt/yoguraso
echo "$PASS" | sudo -S mount -t vboxsf -o uid="$(id -u)",gid="$(id -g)" yoguraso /mnt/yoguraso 2>/dev/null || true

if [ -f /mnt/yoguraso/scripts/ubuntu-aa5-deploy.sh ]; then
  bash /mnt/yoguraso/scripts/ubuntu-aa5-deploy.sh
else
  cd ~/aa5-docker 2>/dev/null && echo "$PASS" | sudo -S docker compose up -d
fi

sleep 2
curl -sI http://127.0.0.1:8080 | head -n 3 || true

echo "$PASS" | sudo -S snap connect firefox:network 2>/dev/null || true
echo "$PASS" | sudo -S snap connect firefox:network-bind 2>/dev/null || true
pkill -f firefox 2>/dev/null
sleep 1
export MOZ_ENABLE_WAYLAND=0
nohup firefox --new-window "http://127.0.0.1:8080" >/dev/null 2>&1 &
echo "OK Firefox -> http://127.0.0.1:8080"
