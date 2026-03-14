# 🕒 ControlPro: Ecosistema de Control Horario Inteligente

ControlPro es una solución integral para la gestión de presencia, horarios y cumplimiento legal de jornadas laborales. Diseñado con una arquitectura moderna y escalable, ofrece interfaces específicas para Administradores (Web) y Empleados (App Móvil).

![Icono del Proyecto](file:///e:/USUARIOS/DEIMOS/ESCRITORIO/app/Control%20Horario/mobile/assets/icon.png)

## 🚀 Características Principales

### 🌐 Panel de Gestión (Web)
*   **Gestión Multisectorial**: Control de múltiples sedes y departamentos.
*   **Dashboard en Tiempo Real**: Visualización de empleados activos, ausencias y retrasos.
*   **Informes Automatizados**: Generación de reportes mensuales en PDF/Excel cumpliendo con la normativa laboral.
*   **Gestión de Solicitudes**: Flujo de aprobación para vacaciones, asuntos propios e incidencias.
*   **Personalización (White Label)**: Configuración de logos, colores y políticas de empresa desde el panel.

### 📱 App de Empleado (Móvil)
*   **Fichaje Geolocalizado**: Registro de entrada y salida con captura obligatoria de coordenadas GPS.
*   **Sincronización Inteligente**: Continuidad si se empieza el fichaje en web y se termina en el móvil.
*   **Seguridad Reforzada (2FA)**: Acceso protegido mediante autenticación de doble factor (TOTP).
*   **Historial y Saldos**: Consulta rápida de horas trabajadas y días de vacaciones restantes.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Backend** | Supabase (PostgreSQL, RLS, Edge Functions, pg_cron) |
| **Frontend Web** | Next.js 15+, TypeScript, Tailwind CSS 4, Shadcn/UI |
| **Mobile** | Expo (React Native), Expo Router, NativeWind |
| **Seguridad** | 2FA personalizado (RFC 6238) con PL/pgSQL |

---

## ⚙️ Guía de Instalación desde 0

### 1. Requisitos Previos
*   [Node.js 20+](https://nodejs.org/)
*   [Docker](https://www.docker.com/) (para ejecución local de Supabase)
*   [Expo CLI](https://docs.expo.dev/get-started/installation/)

### 2. Configuración del Backend (Supabase)
```bash
# Instalar Supabase CLI si no lo tienes
npm install supabase --save-dev

# Iniciar servicios locales
npx supabase start

# Aplicar migraciones para crear las tablas y lógica 2FA
npx supabase db reset
```

### 3. Configuración de la Aplicación Web
```bash
cd web
# Copiar variables de entorno
cp .env.local.example .env.local
# Instalar dependencias
npm install
# Iniciar servidor de desarrollo
npm run dev
```

### 4. Configuración de la Aplicación Móvil
```bash
cd mobile
# Instalar dependencias
npm install
# Iniciar servidor Expo
npx expo start
```

---

## 📸 Pantallas del Proyecto

*Próximamente: Se recomienda añadir aquí capturas de pantalla de las siguientes rutas:*
- `web/app/dashboard` (Vista general)
- `mobile/app/login` (Pantalla de login con 2FA)
- `web/app/settings` (Personalización de marca)

## ⚖️ Cumplimiento Legal
Este software ha sido diseñado para ayudar a las empresas a cumplir con el **Registro Jornada (Real Decreto-ley 8/2019)** en España, garantizando la trazabilidad de los horarios y la custodia de los datos durante los 4 años legales requeridos.

---
Creado con ❤️ por **Deimos** - 2026
