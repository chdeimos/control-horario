# 🚀 Stack Tecnológico - ControlPro

Este documento detalla todas las tecnologías y herramientas utilizadas en el desarrollo del ecosistema **ControlPro**, incluyendo la aplicación web, la aplicación móvil y la infraestructura de backend.

## 🏗️ Core del Proyecto
*   **Gestión de Monorepo**: Estructura organizada con aplicaciones separadas para `/web` y `/mobile`.
*   **Base de Datos y Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions).
*   **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (Tipado estricto en todo el proyecto).

---

## 💻 Aplicación Web (Dashboard & Kiosco)
Ubicada en `/web`, es el centro de control para administradores y puntos de fichaje fijos.

### Frameworks y UI
*   **Next.js 16 (App Router)**: Framework de React para el renderizado del lado del servidor (SSR) y generación estática.
*   **React 19**: Biblioteca base para la interfaz de usuario.
*   **Tailwind CSS**: Framework de CSS para un diseño moderno y responsive.
*   **Radix UI**: Componentes primitivos accesibles y sin estilo para la base de la UI.
*   **Framer Motion**: Biblioteca para animaciones fluidas y micro-interacciones.
*   **Lucide React**: Set de iconos vectoriales modernos.

### Lógica y Datos
*   **Supabase SSR**: Integración de autenticación y datos optimizada para Next.js.
*   **React Hook Form + Resolvers**: Gestión avanzada de formularios.
*   **Zod**: Validación de esquemas de datos tanto en cliente como en servidor.
*   **Sonner**: Sistema de notificaciones (toasts) premium.
*   **Date-fns**: Manipulación y formateo de fechas y tiempos.

### Utilidades y Seguridad
*   **Otplib**: Implementación de TOTP para la autenticación de dos factores (2FA).
*   **QRCode**: Generación de códigos QR para la configuración de 2FA.
*   **Pgcrypto (PostgreSQL)**: Hashing de PINs y encriptación de datos sensibles en la base de datos.
*   **Nodemailer / Resend**: Motores de envío de correos electrónicos.
*   **jsPDF / jspdf-autotable**: Generación de informes y exportaciones en PDF.
*   **JSZip / File-saver**: Gestión de archivos y descargas comprimidas.

---

## 📱 Aplicación Móvil
Ubicada en `/mobile`, diseñada para el personal en movilidad.

### Plataformas y Runtime
*   **React Native**: Framework para aplicaciones nativas usando JavaScript/React.
*   **Expo (SDK 54)**: Plataforma y herramientas para el desarrollo y despliegue rápido de apps nativas.
*   **EAS (Expo Application Services)**: Servicio de compilación (Build) y envío a tiendas.

### Componentes Móviles
*   **Expo Router**: Navegación basada en archivos para React Native.
*   **Lucide React Native**: Iconos optimizados para dispositivos móviles.
*   **React Native SVG**: Renderizado de gráficos vectoriales.
*   **Expo Location**: Acceso a geolocalización precisa para los fichajes.
*   **Expo Secure Store**: Almacenamiento seguro de tokens y credenciales localmente.

---

## 🔒 Seguridad e Infraestructura
*   **Row Level Security (RLS)**: Control de acceso granular a nivel de fila en PostgreSQL.
*   **Hashing BCRYPT**: Almacenamiento seguro de PINs mediante `pgcrypto`.
*   **Aislamiento de Datos**: Tabla `profiles_private` para separar información crítica de perfiles públicos.
*   **RPC (Remote Procedure Calls)**: Funciones de base de datos seguras (`SECURITY DEFINER`) para operaciones restringidas.
*   **Geolocalización**: Validación de ubicación en el momento del fichaje según la configuración de la empresa.

---

## 🛠️ Herramientas de Desarrollo (DevOps)
*   **Supabase CLI**: Gestión de migraciones y entorno local mediante Docker.
*   **Git / GitHub**: Control de versiones y repositorio centralizado.
*   **Husky / Lint-staged**: Hooks de prepush y precommit para asegurar la calidad del código.
*   **Prettier / ESLint**: Formateo y análisis estático de código.
*   **Vite / Vitest**: Entorno de pruebas unitarias.
