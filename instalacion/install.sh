#!/bin/bash
# Script de auto-instalación para Control Horario + Supabase (Self-Hosted)
# Ejecutar como usuario root (dentro del contenedor)

set -e

# DOMINIO DE PRODUCCIÓN CONFIGURABLE
DOMAIN="horario.pandorasoft.com.es"
PROTOCOL="https" # Usaremos HTTPS por defecto en las URL aunque Nginx empiece en HTTP antes de Certbot

echo "=========================================================================="
echo "    INSTALACIÓN COMPLETA: CONTROL HORARIO + SUPABASE EN $DOMAIN "
echo "=========================================================================="

echo "[1/9] Actualizando sistema e instalando dependencias base..."
apt update && apt upgrade -y
apt install -y curl git ufw ca-certificates gnupg jq

echo "[2/9] Instalando Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl start docker || true

echo "[3/9] Instalando Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

echo "[4/9] Instalando Servidor Web (Nginx)..."
apt install -y nginx

read -p "[5/9] Pega la URL de tu repositorio GitHub (el de Control Horario): " REPO_URL
if [ -z "$REPO_URL" ]; then
    echo "URL no proporcionada. Saliendo..."
    exit 1
fi

echo "Clonando en /var/www/control-horario..."
mkdir -p /var/www
cd /var/www
rm -rf control-horario # Eliminar por si existía de un intento fallido previo
git clone "$REPO_URL" control-horario

echo "[6/9] Configurando Supabase (Docker) para el dominio $DOMAIN..."
cd /var/www/control-horario
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

cp .env.example .env
# Inyectar el dominio externo para correos y autenticación
sed -i "s|API_EXTERNAL_URL=http://localhost:8000|API_EXTERNAL_URL=${PROTOCOL}://${DOMAIN}|g" .env

mkdir -p volumes/db/init/
cp /var/www/control-horario/supabase/seed.sql volumes/db/init/00-seed.sql

echo "Levantando servicios de Supabase en background..."
docker compose up -d

echo "Esperando 30 segundos a que la BBDD inicie correctamente..."
sleep 30

ANON_KEY=$(grep "ANON_KEY=" .env | cut -d '=' -f 2)
SERVICE_KEY=$(grep "SERVICE_ROLE_KEY=" .env | cut -d '=' -f 2)

echo "[7/9] Instalando y configurando Control Horario Web (Next.js)..."
cd /var/www/control-horario/web

cat << EOF > .env.local
NEXT_PUBLIC_SUPABASE_URL=${PROTOCOL}://${DOMAIN}
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
NEXT_PUBLIC_APP_URL=${PROTOCOL}://${DOMAIN}
EOF

npm install
npm run build

echo "[8/9] Arrancando FrontEnd con PM2"
pm2 start npm --name "control-horario-web" -- run start
pm2 save
pm2 startup || true

echo "[9/9] Auto-Configurando Nginx para enrutamiento Múltiple..."
cat << EOF > /etc/nginx/sites-available/control-horario
server {
    listen 80;
    server_name $DOMAIN;

    # 1. Enrutar las APIs de Supabase hacia el contenedor Docker (Puerto 8000)
    # Incluye Auth, REST, Storage y GraphQL
    location ~ ^/(auth|rest|storage|graphql|pg|functions)/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 2. Todo lo demás (Interfaz Web) va al frontend Next.js (Puerto 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Habilitar sitio Nginx
ln -sf /etc/nginx/sites-available/control-horario /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx || true

echo "=========================================================================="
echo "    ¡INSTALACIÓN COMPLETADA CON ÉXITO!                                    "
echo "=========================================================================="
echo "✔ Supabase backend operando y configurado con: ${PROTOCOL}://${DOMAIN}"
echo "✔ Web App corriendo en puerto 3000 y enrutada en /"
echo "✔ Nginx como Proxy reverso en el puerto 80"
echo ""
echo "📝 SIGUIENTE PASO IMPORTANTE (Seguridad SSL):"
echo "Ejecuta esto para obtener un certificado HTTPS válido (necesario en Producción):"
echo "   apt install -y certbot python3-certbot-nginx"
echo "   certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m tu-email@ejemplo.com"
echo "=========================================================================="
