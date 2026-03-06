# Plan de Desarrollo: App Móvil (Android & iOS)

Este documento detalla la hoja de ruta para la creación de la aplicación móvil nativa, manteniendo paridad total con las reglas de negocio y estética de la versión web.

## 🛠️ Stack Tecnológico
- **Framework**: React Native con **Expo** (SDK 50+).
- **Navegación**: Expo Router (basado en archivos, similar a Next.js).
- **Backend**: Supabase (JS SDK nativo).
- **Sensores**: `expo-location` (GPS) y `expo-local-authentication` (Biometría opcional).
- **Estilos**: `nativewind` (Tailwind para React Native) para mantener la velocidad de desarrollo.

---

## 📅 Hoja de Ruta

### Fase 0: Configuración de la Instancia (Conexión)
- [x] Pantalla de bienvenida para introducir la URL del servidor (portal de la empresa).
- [x] Validación automática de conexión con el backend.
- [x] Almacenamiento seguro de la URL de la instancia para futuros accesos.

### Fase 1: Entorno e Infraestructura
- [x] Inicialización del proyecto en carpeta `/mobile`.
- [x] Configuración del cliente Supabase dinámico compatible con la URL de la instancia.
- [x] Implementación de `SecureStore` para persistencia de sesión sin login recurrente.

### Fase 2: Navegación por Pestañas (Tab Navigation)
- [x] Barra inferior con Fichaje, Historial y Días Libres.

### Fase 2.5: Autenticación Nativa
- [x] Pantalla de Login conectada al servidor dinámico.
- [x] Persistencia de sesión con SecureStore.

### Fase 3: Pantalla de Fichaje (Home)
- [x] Contador de tiempo en tiempo real con diseño circular.
- [x] Captura obligatoria de GPS (Location Permission).
- [x] Lógica de Iniciar/Finalizar jornada con origen `mobile_app`.

### Fase 4: Mis Fichajes (Historial)
- [x] Listado de los últimos 30 registros con duraciones calculadas.
- [x] Visualización de incidencias y origen del registro.

### Fase 5: Días Libres y Vacaciones
- [x] Tarjetas de saldo de vacaciones y asuntos propios.
- [x] Listado de solicitudes con estados (Aprobado, Pendiente, Rechazado).

### Fase 6: Pulido y Compilación
- [ ] Icono de la app y Splash Screen corporativo.
- [ ] Configuración de `eas.json` para compilación.
- [ ] Pruebas finales de sincronización Web/Móvil.

---

## 🏛️ Reglas Cruciales (Sin Excepciones)
1. **GPS**: Cada fichaje DEBE capturar latitud/longitud. Si falla el GPS, el servidor rechazará la inserción (regla ya implementada en el backend).
2. **Identidad**: El campo `origin` en `time_entries` debe ser siempre `mobile_app`.
3. **Estado**: Al abrir la app, debe consultar `getLastEntry()` para retomar un cronómetro si hay una sesión abierta en la web o el terminal fijo.
