#!/bin/bash
# YogurASO AA5 — Apache + MySQL en Docker (Ubuntu VM)
set -e
PASS="${AA5_PASS:-ubuntu123}"

echo "=== Instalando Guest Additions (vboxsf) ==="
echo "$PASS" | sudo -S DEBIAN_FRONTEND=noninteractive apt-get install -y virtualbox-guest-utils virtualbox-guest-dkms 2>/dev/null || true
echo "$PASS" | sudo -S modprobe vboxsf 2>/dev/null || true

echo "$PASS" | sudo -S mkdir -p /mnt/yoguraso
echo "$PASS" | sudo -S mount -t vboxsf -o uid="$(id -u)",gid="$(id -g)" yoguraso /mnt/yoguraso 2>/dev/null || true

if [ -d /mnt/yoguraso/frontend ]; then
  FRONT="/mnt/yoguraso/frontend"
elif [ -d /media/sf_yoguraso/frontend ]; then
  FRONT="/media/sf_yoguraso/frontend"
else
  echo "Montando desde host Windows (10.0.2.2:8099)..."
  mkdir -p ~/aa5-docker/html
  if curl -sf http://10.0.2.2:8099/ >/dev/null; then
    rm -rf ~/aa5-docker/html/*
    (cd ~/aa5-docker/html && curl -s http://10.0.2.2:8099/ -o index.html)
    for d in css js pages; do
      mkdir -p ~/aa5-docker/html/$d
      curl -s "http://10.0.2.2:8099/$d/" 2>/dev/null | grep -oP 'href="\K[^"]+' | while read f; do
        curl -s "http://10.0.2.2:8099/$d/$f" -o "~/aa5-docker/html/$d/$f" 2>/dev/null || true
      done
    done
    FRONT="$HOME/aa5-docker/html"
  else
    echo "ERROR: no hay carpeta compartida ni servidor en host"
    exit 1
  fi
fi

mkdir -p ~/aa5-docker
if [ "$FRONT" != "$HOME/aa5-docker/html" ]; then
  mkdir -p ~/aa5-docker/html
  cp -r "$FRONT"/* ~/aa5-docker/html/
  FRONT="$HOME/aa5-docker/html"
fi

cat > ~/aa5-docker/docker-compose.yml <<EOF
services:
  apache:
    image: httpd:2.4
    container_name: aa5_apache
    ports:
      - "8080:80"
    volumes:
      - ${FRONT}:/usr/local/apache2/htdocs/
  mysql:
    image: mysql:8.0
    container_name: aa5_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: yoguraso_test
    ports:
      - "3307:3306"
EOF

echo "Frontend: $FRONT"
echo "$PASS" | sudo -S systemctl start docker
cd ~/aa5-docker
echo "$PASS" | sudo -S docker compose down 2>/dev/null || true
echo "$PASS" | sudo -S docker compose up -d
echo "$PASS" | sudo -S docker ps
curl -sI http://127.0.0.1:8080 | head -n 8
curl -s http://127.0.0.1:8080 | head -n 12
echo "OK Ubuntu: http://127.0.0.1:8080 | Windows NAT: http://127.0.0.1:8088"
