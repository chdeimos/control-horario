# Guía de Instalación - Control Horario

Este directorio contiene el script automatizado para el despliegue de la aplicación en un contenedor Debian. 
El script está preparado para ejecutarse con el usuario `root` y auto-configurar el dominio `horario.pandorasoft.com.es` conectando Next.js y Supabase de forma integrada.

## Requisitos previos

- Un servidor o contenedor Debian limpio.
- Acceso a Internet desde el contendor/servidor.
- Tener el dominio **horario.pandorasoft.com.es** apuntando a la IP pública del servidor.

## Cómo ejecutar la instalación

1. **Abre una terminal** en tu contenedor Debian.

2. **Descarga el script de instalación** directamente desde tu repositorio remoto en GitHub:
   ```bash
   wget https://raw.githubusercontent.com/TU_USUARIO/TU_REPOSITORIO/master/instalacion/install.sh -O install.sh
   ```
   *(Asegúrate de cambiar TU_USUARIO y TU_REPOSITORIO por los tuyos).*

3. **Otorga permisos de ejecución** al script:
   ```bash
   chmod +x install.sh
   ```

4. **Inicia la instalación automatizada**:
   ```bash
   ./install.sh
   ```

## ¿Qué hace el script automatizado?

El script de instalación realiza las siguientes acciones:
- Instala dependencias básicas del sistema, **Node.js** v20, **PM2**, **Docker**, **Docker Compose** y **Nginx**.
- Pide la URL de tu repositorio GitHub para clonarlo en `/var/www/control-horario`.
- Descarga y despliega **Supabase (Self-Hosted)** mediante contenedores Docker en background. Inyecta tu esquema y usuario admin (desde `supabase/seed.sql`).
- Configura el archivo `.env.local` conectando las claves locales de Docker hacia Next.js.
- Instala, compila e inicia el frontend Next.js usando PM2.
- **Configura Nginx Automáticamente:** Crea un proxy inverso para que tu dominio `horario.pandorasoft.com.es` sirva la web en la raíz (`/`), pero redirija internamente las peticiones de Autenticación y Base de Datos (`/auth/*`, `/rest/*` etc.) al contenedor API de Supabase de manera transparente.

## Pasos tras la instalación 

1. **Certificado SSL (Recomendado):** El protocolo Auth de Supabase (y las mejores prácticas web) requieren que el sitio sea HTTPS. 
Para obtener tu certificado gratuito simplemente ejecuta:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d horario.pandorasoft.com.es
```

2. **Acceso:**
- Interfaz web y aplicación: [https://horario.pandorasoft.com.es](https://horario.pandorasoft.com.es)
- Panel backend (Supabase Studio): Accesible temporalmente abriendo el puerto `8000` de la IP de tu servidor (`http://TU_IP:8000`). Se recomienda bloquear o asegurar este puerto por firewall en entornos productivos estrictos tras la configuración inicial.
