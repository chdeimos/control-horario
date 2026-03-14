# 🚀 Stack Tecnológico - ControlPro

Este documento detalla todas las tecnologías y herramientas utilizadas en el desarrollo del ecosistema **ControlPro**, incluyendo la aplicación web, la aplicación móvil y la infraestructura de backend.

## 🏗️ Core del Proyecto
*   **Gestión de Monorepo**: Estructura organizada con aplicaciones separadas para `/web` y `/mobile`.
*   **Base de Datos y Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime).
*   **Infraestructura de Producción**: Servidor propio con **Debian Linux** ejecutando Supabase mediante Docker.
*   **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (Tipado estricto en todo el proyecto).

---

## 💻 Aplicación Web (Dashboard & Kiosco)
Ubicada en `/web`, es el centro de control para administradores y puntos de fichaje fijos.

### Frameworks y UI
*   **Next.js 15+ (App Router)**: Framework de React para el renderizado del lado del servidor (SSR) y Server Actions.
*   **React 19**: Biblioteca base para la interfaz de usuario.
*   **Tailwind CSS**: Framework de CSS para un diseño moderno y responsive.
*   **Radix UI / Shadcn UI**: Componentes accesibles y premium para la base de la interfaz.
*   **Framer Motion**: Biblioteca para animaciones fluidas y micro-interacciones.
*   **Lucide React**: Set de iconos vectoriales modernos.

### Lógica y Datos
*   **Supabase SSR**: Integración de autenticación y datos optimizada para sesiones en servidor.
*   **Zod**: Validación de esquemas de datos estricta en formularios y APIs.
*   **Sonner**: Sistema de notificaciones (toasts) de alto rendimiento.
*   **Date-fns**: Gestión avanzada de zonas horarias y cálculos de jornadas laborales.

---

## 📱 Aplicación Móvil
Ubicada en `/mobile`, diseñada para el personal en movilidad.

### Plataformas y Runtime
*   **React Native**: Desarrollo de aplicaciones nativas multiplataforma.
*   **Expo (SDK 54)**: Ecosistema para el desarrollo y despliegue rápido.
*   **EAS (Expo Application Services)**: Pipeline de compilación nativa para Android e iOS.
*   **React Native Paper**: Sistema de diseño basado en Material Design.

### Componentes Críticos
*   **Expo Location**: Geolocalización precisa con validación de permisos en tiempo real.
*   **Expo Router**: Navegación moderna basada en el sistema de archivos.
*   **Secure Store**: Encriptación local de secretos de servidor y tokens de sesión.

---

## 🔒 Seguridad Avanzada e Infraestructura
Implementación de estándares industriales para la protección de datos laborales y personales.

*   **Hashing de PINs (BCRYPT)**: Los códigos de fichaje no se guardan en texto plano. Se utiliza `pgcrypto` con sal variable por usuario.
*   **Aislamiento de Datos (Private Schema)**: Tabla `profiles_private` con RLS estricto, inaccesible desde el cliente sin pasar por funciones autorizadas.
*   **Autenticación 2FA (TOTP)**: Soporte nativo para Google Authenticator, Microsoft Authenticator y similares.
*   **Seguridad de Procedimientos (RPC)**: Uso de funciones `SECURITY DEFINER` con parámetros de alta compatibilidad (`TEXT`) para evitar fugas de tipos y problemas de caché de PostgREST.
*   **Fichaje Geolocalizado**: Captura de coordenadas GPS en cada entrada/salida móvil con visualización en mapas de administración.
*   **Sincronización de Esquema**: Sistema de notificación automatizado (`NOTIFY pgrst, 'reload schema'`) para asegurar la disponibilidad inmediata de cambios en producción.

---

## 🛠️ Entorno de Operaciones (DevOps)
*   **Docker & Docker Compose**: Orquestación de servicios de Supabase en servidores Debian.
*   **Supabase CLI**: Gestión de migraciones locales y sincronización con producción.
*   **Git**: Flujo de trabajo basado en ramas para actualizaciones seguras.
*   **PM2**: Gestor de procesos para mantener la web activa 24/7 en el servidor Linux.
*   **NGINX**: Proxy inverso para gestión de SSL/TLS y balanceo de carga.
