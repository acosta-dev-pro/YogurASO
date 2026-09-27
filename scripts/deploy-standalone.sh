#!/bin/bash
# Despliegue YogurASO SIN carpeta compartida (usa red NAT 10.0.2.2)
set -e
PASS="${AA5_PASS:-ubuntu123}"
HOST="http://10.0.2.2:8900"

echo "=== YogurASO deploy standalone ==="
mkdir -p ~/aa5-docker/html
cd ~/aa5-docker/html

if curl -sf "$HOST/frontend/index.html" >/dev/null; then
  echo "Descargando frontend desde Windows ($HOST)..."
  rm -rf ~/aa5-docker/html/*
  wget -r -np -nH --cut-dirs=1 -q -P ~/aa5-docker/html "$HOST/frontend/" || true
  # wget puede dejar en html/frontend/ subfolder
  if [ -d ~/aa5-docker/html/frontend ]; then
    mv ~/aa5-docker/html/frontend/* ~/aa5-docker/html/ 2>/dev/null || true
    rmdir ~/aa5-docker/html/frontend 2>/dev/null || true
  fi
else
  echo "ERROR: no hay servidor en $HOST - avisa al asistente"
  exit 1
fi

cat > ~/aa5-docker/docker-compose.yml <<'EOF'
services:
  apache:
    image: httpd:2.4
    container_name: aa5_apache
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/local/apache2/htdocs/
  mysql:
    image: mysql:8.0
    container_name: aa5_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: yoguraso_test
    ports:
      - "3307:3306"
EOF

echo "$PASS" | sudo -S systemctl start docker
cd ~/aa5-docker
echo "$PASS" | sudo -S docker compose down 2>/dev/null || true
echo "$PASS" | sudo -S docker compose up -d
sleep 3
echo "$PASS" | sudo -S docker ps
curl -sI http://127.0.0.1:8080 | head -n 3

echo "$PASS" | sudo -S snap connect firefox:network 2>/dev/null || true
pkill -f firefox 2>/dev/null; sleep 1
export MOZ_ENABLE_WAYLAND=0
nohup firefox --new-window "http://127.0.0.1:8080" >/dev/null 2>&1 &
echo "OK -> http://127.0.0.1:8080"
