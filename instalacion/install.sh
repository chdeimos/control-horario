#!/bin/bash
# Script de auto-instalación para Control Horario + Supabase (Self-Hosted) en contenedor Debian
# Ejecutar como usuario root (dentro del contenedor)

set -e # Detiene el script si hay un error

echo "=========================================================================="
echo "    INICIANDO INSTALACIÓN COMPLETA: CONTROL HORARIO + SUPABASE LOCAL      "
echo "=========================================================================="

# 1. Actualizar e instalar básicos
echo "[1/8] Actualizando sistema e instalando dependencias base..."
apt update && apt upgrade -y
apt install -y curl git ufw ca-certificates gnupg jq

# 2. Instalar Docker y Docker Compose
echo "[2/8] Instalando Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl start docker || true

# 3. Instalar Node.js y PM2
echo "[3/8] Instalando Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# 4. Instalar Nginx
echo "[4/8] Instalando Servidor Web (Nginx)..."
apt install -y nginx

# 5. Clonar el repositorio principal
read -p "[5/8] Pega la URL de tu repositorio GitHub (el de Control Horario): " REPO_URL
if [ -z "$REPO_URL" ]; then
    echo "URL no proporcionada. Saliendo..."
    exit 1
fi

echo "Clonando en /var/www/control-horario..."
mkdir -p /var/www
cd /var/www
git clone "$REPO_URL" control-horario

# 6. Desplegar Supabase usando Docker
echo "[6/8] Clonando y configurando Supabase (Docker)..."
cd /var/www/control-horario
# Obtenemos la versión oficial docker-compose de Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copiar el .env en base al template
cp .env.example .env

# ¡CRÍTICO! Necesitamos poblar la BBDD inicial
# Copiar el script de semillas del proyecto original de la app para que se ejecute al arrancar la BBDD
mkdir -p volumes/db/init/
cp /var/www/control-horario/supabase/seed.sql volumes/db/init/00-seed.sql

echo "Levantando servicios de Supabase en background..."
docker compose up -d

echo "Esperando 30 segundos a que la BBDD inicie correctamente..."
sleep 30

# Extraer el API KEY y URL que genera docker por defecto
ANON_KEY=$(grep "ANON_KEY=" .env | cut -d '=' -f 2)
SERVICE_KEY=$(grep "SERVICE_ROLE_KEY=" .env | cut -d '=' -f 2)
SUPABASE_URL="http://127.0.0.1:8000" # Puerto por defecto en supabase-docker del Kong API Gateway

# 7. Configurar e Instalar la App Web
echo "[7/8] Instalando y configurando Control Horario Web..."
cd /var/www/control-horario/web

# Auto-generar el .env.local
cat << EOF > .env.local
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

npm install
npm run build

# 8. Arrancar con PM2
echo "[8/8] Arrancando Node.js con PM2"
pm2 start npm --name "control-horario-web" -- run start
pm2 save
pm2 startup || true

echo "=========================================================================="
echo "    ¡INSTALACIÓN COMPLETADA CON ÉXITO!                                    "
echo "=========================================================================="
echo "Servicios instalados:"
echo "- Docker con Supabase local (Puerto 8000 y 5432)"
echo "- Node.js levantado en (Puerto 3000)"
echo "- Nginx (Puerto 80 listo para configurar dominios)"
echo ""
echo "🔑 Las claves de Supabase ya fueron configuradas automáticamente en web/.env.local"
echo "El usuario administrador base (admin@example.com / admin123) ya está inyectado gracias a supabase/seed.sql"
echo ""
echo "📝 SIGUIENTES PASOS MANUALES:"
echo "1. Ajusta Nginx para apuntar tu dominio al puerto 3000"
echo "2. Para acceder al Supabase Studio (Panel de base de datos visual):"
echo "   Entra en http://TU_IP_DEL_SERVIDOR:8000"
echo "=========================================================================="
