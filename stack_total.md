# 🛠️ Stack Tecnológico Total: Control Horario

Este documento resume todas las tecnologías, frameworks y herramientas utilizadas en el desarrollo integral del ecosistema de Control Horario (Web, Móvil e Infraestructura).

---

## 🏗️ Backend e Infraestructura (Supabase)
El núcleo del sistema reside en una arquitectura "Backend as a Service" (BaaS).

- **Base de Datos**: PostgreSQL (Relacional).
- **Autenticación**: Supabase Auth (JWT, Row Level Security - RLS).
- **Almacenamiento**: Supabase Storage (Buckets para logos e imágenes).
- **Lógica de Base de Datos**: PL/pgSQL (Funciones RPC, Triggers).
- **Seguridad 2FA**: Implementación personalizada de TOTP (RFC 6238) mediante `pgcrypto`.
- **Automatización**: pg_cron para generación de reportes y limpiezas automáticas.

## 🌐 Aplicación Web (Administración y Gestión)
Panel de control para superadmins y responsables de recursos humanos.

- **Framework**: Next.js 15+ (App Router).
- **Lenguaje**: TypeScript.
- **Estilos**: Tailwind CSS 4.0.
- **Componentes UI**: Shadcn/UI (Radix UI).
- **Iconografía**: Lucide React.
- **Visualización de Datos**: Recharts para estadísticas de fichaje.
- **Validación de Formularios**: Zod + React Hook Form.

## 📱 Aplicación Móvil (Empleados)
Aplicación nativa para el registro de jornada y consulta de vacaciones.

- **Framework**: Expo (SDK 50+) / React Native.
- **Navegación**: Expo Router (Basado en archivos).
- **Estilos**: NativeWind (Tailwind para móvil) / CSS-in-JS.
- **Geolocalización**: Expo Location (Captura de GPS obligatoria).
- **Almacenamiento Seguro**: Expo Secure Store (Persistencia de sesión).
- **Iconografía**: Lucide React Native.
- **Distribución**: EAS (Expo Application Services) para APK y App Bundle.

## 🛠️ Herramientas de Desarrollo y DevOps
- **Control de Versiones**: Git & GitHub.
- **Contenedores**: Docker (para entornos de Supabase Local).
- **CLI**: Supabase CLI (Migraciones de base de datos).
- **AI Integration**: Antigravity (Advanced Agentic Coding).

---
*Última actualización: 14 de marzo de 2026*
