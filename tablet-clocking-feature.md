# Plan de Implementación: Utilidad de Fichaje Fijo (Tablet)

## Goal
Crear una interfaz de fichaje táctil optimizada para tablets que permita a los empleados fichar mediante un PIN de 4 cifras, con personalización por empresa, autoreset y sin requerimiento de GPS.

## Tasks
- [x] **DB & Settings**: Añadir `kiosk_image_url` a `companies` y `kiosk_reset_seconds` a `system_settings`. → Verify: Columnas accesibles.
- [x] **Security Layer**: Implementar validación de `api_key` de la tabla `devices` como token de acceso en la URL `/fichaje-fijo/[token]`. → Verify: URL no válida retorna 401/404.
- [x] **Kiosk Server Action**: Crear `kioskClockAction(token, pin)` que valide el PIN dentro de la empresa del dispositivo y registre el fichaje (Entrada/Salida automática). → Verify: Fichaje exitoso retorna datos del perfil.
- [x] **Keypad Component**: Teclado táctil con lógica de "Idle Cleanup" (10s sin actividad limpia la entrada). → Verify: Teclado se resetea solo tras 10s.
- [x] **Success View**: Pantalla de confirmación que muestre: Nombre del empleado, "Entrada" o "Salida" en grande, y la Hora exacta. -> Verify: Info correcta en pantalla tras PIN válido.
- [x] **Auto-Reset**: Temporizador configurable (global en SuperAdmin) para volver al teclado tras los 30s de éxito. → Verify: Reseteo funcional.
- [x] **Company Customization**: Panel para subir foto 1:1 en Configuración de Empresa;Fallback a foto de SuperAdmin si no existe. → Verify: Imagen visible junto al teclado.
- [x] **GPS bypass**: Asegurar que la lógica de `time_entries` permite fichajes desde `tablet_kiosk` sin `gps_lat/long`. → Verify: Inserción exitosa en DB sin coordenadas.

## Done When
- [ ] Acceso seguro vía Token único por tablet.
- [ ] Fichaje completado mostrando Nombre, Tipo de Fichaje y Hora.
- [ ] Reseteo automático del teclado (10s) y de la pantalla de éxito (30s).
- [ ] Branding personalizado visible en la interfaz.

## Notes
- Origen del fichaje: `hardware_tablet` (nuevo valor de enum o mapeo interno).
- La validación de entrada/salida se basa en si el usuario tiene una sesión abierta sin `clock_out`.
- Personalización visual: Modo oscuro por defecto para estética "premium".
