# ControlPro - Sistema de Gestión de Presencia y Control Horario

ControlPro es una solución integral diseñada para facilitar el cumplimiento del registro horario obligatorio, ofreciendo una experiencia moderna, segura y multiplataforma tanto para empresas como para empleados.

## 🌟 Características Principales

*   **Multiplataforma**: Acceso vía Web (Administración y Kiosco) y App Móvil (Empleados en movilidad).
*   **Seguridad Avanzada**:
    *   Autenticación de Dos Factores (2FA) opcional para administradores.
    *   Hashing de PINs con BCRYPT para máxima privacidad.
    *   Aislamiento de datos sensibles en almacenamiento privado.
*   **Geolocalización**: Registro preciso de la ubicación en cada fichaje para evitar fraudes.
*   **Gestión de Ausencias**: Control de vacaciones, días personales y bajas médicas con sistema de aprobación.
*   **Informes y Auditoría**: Generación de informes en PDF y exportaciones para cumplir con inspecciones de trabajo.
*   **Modo Kiosco**: Interfaz simplificada para tabletas en puntos físicos de entrada/salida.

## 🛠️ Tecnologías

### Backend & Seguridad
*   **Supabase**: Base de datos PostgreSQL, Autenticación y Storage.
*   **Row Level Security (RLS)**: Protección de datos a nivel de registro.
*   **Edge Functions**: Lógica de servidor escalable.

### Frontend Web
*   **Next.js 16 (React 19)**: Interfaz de administración rápida y SEO-friendly.
*   **Tailwind CSS**: Diseño moderno y profesional.
*   **Framer Motion**: Animaciones fluidas.

### Aplicación Móvil
*   **React Native (Expo)**: Aplicación nativa para iOS y Android con geolocalización integrada.

---

## 🚀 Guía de Instalación desde Cero

Sigue estos pasos para desplegar el proyecto en un entorno de desarrollo o producción:

### 1. Clonar el repositorio
```bash
git clone https://github.com/chdeimos/control-horario.git
cd control-horario
```

### 2. Configurar la Base de Datos (Supabase)
Es necesario tener instalado [Docker](https://www.docker.com/) y la [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
# Iniciar servicios locales
npx supabase start

# Aplicar migraciones
npx supabase migration up
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la carpeta `/web`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 4. Instalar dependencias e iniciar la Web
```bash
cd web
npm install
npm run dev
```

### 5. Iniciar la Aplicación Móvil
```bash
cd ../mobile
npm install
npx expo start
```

---

## 📸 Capturas de Pantalla

*Próximamente estaremos añadiendo capturas detalladas de la Interfaz de Administración, el Modo Kiosco y la App Móvil.*

## 📄 Licencia
Este proyecto es propiedad de **ControlPro**. Todos los derechos reservados.
