# Guía de Instalación - Control Horario

Este directorio contiene los scripts automatizados para el despliegue de la aplicación en un contenedor Debian. 
El script está preparado para ejecutarse con el usuario `root` sin necesidad del comando `sudo`.

## Requisitos previos

- Un contenedor Debian limpio.
- Acceso a Internet desde el contenedor.
- Haber subido el repositorio a GitHub o tener una URL accesible para descargarlo.

## Cómo ejecutar la instalación

1. **Abre una terminal** en tu contenedor Debian y dirígete a un directorio donde desees mantener tus archivos temporalmente, por ejemplo `/root` o `/tmp`.

2. **Descarga el script de instalación** directamente desde tu repositorio remoto en GitHub:
   ```bash
   wget https://raw.githubusercontent.com/TU_USUARIO/TU_REPOSITORIO/master/instalacion/install.sh
   ```
   *(Asegúrate de cambiar TU_USUARIO y TU_REPOSITORIO por los tuyos).*

   **Alternativa manual**:
   Crea un archivo llamado `install.sh`, pega el contenido en él y guárdalo:
   ```bash
   nano install.sh
   # (Pega el código)
   # Guarda con Ctrl+O, Enter, y sal con Ctrl+X.
   ```

3. **Otorga permisos de ejecución** al script:
   ```bash
   chmod +x install.sh
   ```

4. **Inicia la instalación automatizada**:
   ```bash
   ./install.sh
   ```

## ¿Qué hace el script automatizado?

El script se encargará de instalar y configurar de forma desatendida:
- Utilidades básicas del sistema.
- **Docker** y **Docker Compose**.
- Levantará los contenedores oficiales de **Supabase** que servirán como tu Base de Datos en el servidor local.
- **Node.js** v20, **PM2**, y **Nginx**.
- Clonará el proyecto "Control Horario", extraerá la configuración generada por Supabase, e iniciará el proyecto web en producción en el puerto `3000`.

## Pasos tras la instalación 

1. **Proxy Inverso (Nginx):** El script instalará pero no configurará los dominios finales. Deberás configurar Nginx (`/etc/nginx/sites-available/`) para apuntar al puerto `3000` para la Web y al `8000` si quieres acceder de manera pública a las APIs de Auth/DB de Supabase.
2. **Acceso al Panel Supabase:** Por defecto, podrás ver el panel de control de Supabase a través del puerto `8000` de la IP de tu servidor (`http://TU_IP:8000`).
