#!/bin/bash
# YogurASO en Ubuntu: Docker + abrir web (metodo raro pero funcional)
set -e
PASS="${AA5_PASS:-ubuntu123}"
HOST="http://10.0.2.2:8900"
URL="http://127.0.0.1:8080"
LOG="$HOME/aa5-docker/deploy-raro.log"
mkdir -p "$HOME/aa5-docker/html"
exec > >(tee -a "$LOG") 2>&1

echo "=== YogurASO Ubuntu raro $(date) ==="

echo "$PASS" | sudo -S systemctl start docker 2>/dev/null || true
echo "$PASS" | sudo -S modprobe vboxsf 2>/dev/null || true
echo "$PASS" | sudo -S mkdir -p /mnt/yoguraso
echo "$PASS" | sudo -S mount -t vboxsf -o uid="$(id -u)",gid="$(id -g)" yoguraso /mnt/yoguraso 2>/dev/null || true

FRONT=""
if [ -d /mnt/yoguraso/frontend ]; then
  FRONT="/mnt/yoguraso/frontend"
  echo "Frontend: carpeta compartida"
elif [ -d /media/sf_yoguraso/frontend ]; then
  FRONT="/media/sf_yoguraso/frontend"
  echo "Frontend: sf_yoguraso"
elif curl -sf "$HOST/frontend/index.html" >/dev/null; then
  echo "Frontend: descarga NAT desde Windows ($HOST)"
  rm -rf "$HOME/aa5-docker/html"
  mkdir -p "$HOME/aa5-docker/html"
  (cd "$HOME/aa5-docker/html" && \
    curl -sf "$HOST/frontend/index.html" -o index.html && \
    for d in css js pages; do
      mkdir -p "$d"
      curl -sf "$HOST/frontend/$d/" 2>/dev/null | grep -oE 'href="[^"]+"' | sed 's/href="//;s/"$//' | while read -r f; do
        case "$f" in http*|/*) continue ;; esac
        curl -sf "$HOST/frontend/$d/$f" -o "$d/$f" 2>/dev/null || true
      done
    done)
  FRONT="$HOME/aa5-docker/html"
else
  echo "ERROR: no hay frontend (monta shared folder o enciende serve en Windows :8900)"
  exit 1
fi

if [ "$FRONT" != "$HOME/aa5-docker/html" ]; then
  rm -rf "$HOME/aa5-docker/html"
  mkdir -p "$HOME/aa5-docker/html"
  cp -a "$FRONT"/. "$HOME/aa5-docker/html/"
  FRONT="$HOME/aa5-docker/html"
fi

cat > "$HOME/aa5-docker/docker-compose.yml" <<'EOF'
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

cd "$HOME/aa5-docker"
echo "$PASS" | sudo -S docker compose down 2>/dev/null || true
echo "$PASS" | sudo -S docker compose up -d
sleep 4
echo "$PASS" | sudo -S docker ps
curl -sfI "$URL" | head -n 3 || { echo "Apache no responde"; exit 1; }

# --- Abrir web: metodo raro (kiosco + atajo escritorio + xdg) ---
echo "$PASS" | sudo -S snap connect firefox:network 2>/dev/null || true
echo "$PASS" | sudo -S snap connect firefox:network-bind 2>/dev/null || true
pkill -f firefox 2>/dev/null || true
sleep 1
export MOZ_ENABLE_WAYLAND=0
export DISPLAY="${DISPLAY:-:0}"

mkdir -p "$HOME/Desktop"
cat > "$HOME/Desktop/YOGURASO-DOCKER.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=YogurASO Docker
Exec=firefox --kiosk $URL
Icon=web-browser
Terminal=false
EOF
chmod +x "$HOME/Desktop/YOGURASO-DOCKER.desktop"

# 1) Firefox pantalla completa (kiosco) — no bloquear script
( firefox --kiosk "$URL" & ) >/dev/null 2>&1 &
sleep 1

# 2) Respaldo: ventana normal si kiosco fallo
if ! pgrep -f firefox >/dev/null; then
  nohup firefox --new-window "$URL" >/dev/null 2>&1 &
fi

# 3) Respaldo raro: xdg-open
if ! pgrep -f firefox >/dev/null; then
  nohup xdg-open "$URL" >/dev/null 2>&1 &
fi

command -v notify-send >/dev/null && notify-send "YogurASO" "Docker OK -> $URL" || true

echo "OK Docker + Firefox -> $URL"
echo "Windows NAT -> http://127.0.0.1:8088"
