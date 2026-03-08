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

# Corrección fuerte para contenedores (LXC/Proxmox) con problemas de IPv6 a Docker Hub
echo "precedence ::ffff:0:0/96  100" >> /etc/gai.conf || true
sysctl -w net.ipv6.conf.all.disable_ipv6=1 || true
sysctl -w net.ipv6.conf.default.disable_ipv6=1 || true
sysctl -w net.ipv6.conf.lo.disable_ipv6=1 || true

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

# Crear configuración explícita para forzar Docker a no usar IPv6 ni en la resolución
# y configurar un MTU de 1400 y DNS 8.8.8.8 para evitar cortes TLS (MTU drops) en Cloudflare
mkdir -p /etc/docker
cat << EOF > /etc/docker/daemon.json
{
  "ipv6": false,
  "ip6tables": false,
  "mtu": 1200,
  "default-address-pools": [{"base":"172.17.0.0/16","size":24}],
  "max-concurrent-downloads": 1,
  "dns": ["1.1.1.1", "8.8.8.8"],
  "registry-mirrors": [
    "https://mirror.gcr.io",
    "https://huecker.io"
  ]
}
EOF

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

echo ""
read -p "🔑 Introduce el EMAIL para el Super Administrador del Sistema: " SA_EMAIL
if [ -z "$SA_EMAIL" ]; then
    SA_EMAIL="admin@example.com"
fi

read -s -p "🔑 Introduce la CONTRASEÑA para el Super Administrador: " SA_PASS
echo ""
if [ -z "$SA_PASS" ]; then
    SA_PASS="admin123"
fi
echo ""

echo "Clonando en /var/www/control-horario..."
mkdir -p /var/www
cd /var/www
rm -rf control-horario # Eliminar por si existía de un intento fallido previo
git clone "$REPO_URL" control-horario

echo "[6/9] Configurando Supabase (Docker) para el dominio $DOMAIN..."
cd /var/www/control-horario
git clone --depth 1 https://github.com/supabase/supabase supabase-docker-repo
cd supabase-docker-repo/docker

cp .env.example .env
# Inyectar el dominio externo para correos y autenticación
sed -i "s|API_EXTERNAL_URL=http://localhost:8000|API_EXTERNAL_URL=${PROTOCOL}://${DOMAIN}|g" .env
echo "GOTRUE_MAILER_EXTERNAL_HOSTS=${DOMAIN}" >> .env
echo "GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED=true" >> .env

# Desactivar Analytics y Vector para ahorrar RAM y evitar que el contenedor colapse
sed -i 's/^ENABLE_ANALYTICS=true/ENABLE_ANALYTICS=false/' .env
sed -i 's/^ENABLE_VECTOR=true/ENABLE_VECTOR=false/' .env

# Copiar las tablas justo al final del proceso base de Supabase (99)
mkdir -p volumes/db/init/
cat /var/www/control-horario/supabase/migrations/*.sql > volumes/db/init/99-migrations.sql
# No copiamos seed.sql porque lo haremos vía API con TypeScript para que resuelva dependencias Auth
chmod -R 777 volumes/

echo "Generando override para Plantillas de Correo..."
cat << EOF > docker-compose.override.yml
services:
  auth:
    environment:
      GOTRUE_MAILER_EXTERNAL_HOSTS: \${GOTRUE_MAILER_EXTERNAL_HOSTS}
      GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED: \${GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED}
      GOTRUE_MAILER_TEMPLATES_CONFIRMATION: ${PROTOCOL}://${DOMAIN}/api/mail-templates?type=confirmation
      GOTRUE_MAILER_TEMPLATES_RECOVERY: ${PROTOCOL}://${DOMAIN}/api/mail-templates?type=recovery
      GOTRUE_MAILER_TEMPLATES_MAGIC_LINK: ${PROTOCOL}://${DOMAIN}/api/mail-templates?type=magic_link
      GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE: ${PROTOCOL}://${DOMAIN}/api/mail-templates?type=email_change
      GOTRUE_MAILER_TEMPLATES_INVITE: ${PROTOCOL}://${DOMAIN}/api/mail-templates?type=invite
EOF

echo "Levantando servicios de Supabase en background..."
docker compose up -d

echo "Esperando 45 segundos a que la BBDD inicie correctamente..."
sleep 45

# Forzar corrección de columnas faltantes en los buckets Storage
echo "ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS file_size_limit bigint; ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS allowed_mime_types text[]; ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS public boolean DEFAULT false;" | docker compose exec -T db psql -U supabase_admin || true
docker compose restart rest auth kong imgproxy storage
sleep 10

ANON_KEY=$(grep "ANON_KEY=" .env | cut -d '=' -f 2)
SERVICE_KEY=$(grep "SERVICE_ROLE_KEY=" .env | cut -d '=' -f 2)

echo "[7/9] Instalando y configurando Control Horario Web (Next.js)..."
cd /var/www/control-horario/web

cat << EOF > .env.local
NEXT_PUBLIC_SUPABASE_URL=${PROTOCOL}://${DOMAIN}
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
NEXT_PUBLIC_APP_URL=${PROTOCOL}://${DOMAIN}
SUPERADMIN_EMAIL=$SA_EMAIL
SUPERADMIN_PASSWORD=$SA_PASS
EOF

npm install

echo "[8/9] Auto-Sembrando Base de Datos..."
# Ejecutamos el script de Node directamente por API
npm install -g tsx
tsx scripts/seed-full.ts || true

npm run build

echo "[9/9] Arrancando FrontEnd con PM2"
pm2 start npm --name "control-horario-web" -- run start
pm2 save
pm2 startup || true

echo "[10/10] Auto-Configurando Nginx para enrutamiento Múltiple (Puerto 8080)..."
cat << EOF > /etc/nginx/sites-available/control-horario
server {
    listen 8080;
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
echo "✔ Nginx como Proxy reverso escuchando en el puerto 8080"
echo ""
echo "📝 Si usas Nginx Proxy Manager, apunta a la IP de este servidor al PUERTO 8080"
