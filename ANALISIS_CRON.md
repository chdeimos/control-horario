# Análisis del Sistema CRON - Automatización y Vigilancia

Este documento detalla las tareas programadas y los procesos de automatización configurados en la aplicación para garantizar la integridad de los datos, la facturación automática y la vigilancia de la jornada laboral.

## 1. Infraestructura Técnica
El sistema utiliza **`pg_cron`** (extensión de PostgreSQL para Supabase) como motor de programación. Las tareas de base de datos invocan endpoints de la **API de Next.js** para ejecutar lógica compleja de negocio en el servidor.

---

## 2. Tarea de Vigilancia: `check-missing-clocks-job`
Es la tarea principal del sistema, encargada de auditar el estado de los fichajes en tiempo real.

*   **Frecuencia:** Cada 15 minutos (`*/15 * * * *`).
*   **Endpoint invocado:** `/api/cron/notifications`
*   **Funciones principales:**

### A. Limpieza de Fichajes Olvidados (Días Anteriores)
*   **Lógica:** Busca entradas que permanecen abiertas (`clock_out` es nulo) iniciadas en días anteriores.
*   **Umbral:** Si han pasado más de 16 horas desde la entrada, el sistema las cierra automáticamente a las 23:59:59 del día de inicio.
*   **Acción:** Genera una incidencia automática ("Fichaje olvidado") y notifica al empleado por email.

### B. Vigilancia de Horarios Fijos (Recordatorios y Cierres)
*   **Recordatorio de Entrada:** Si un empleado tiene horario fijo y no ha fichado tras pasar el margen de cortesía (30 min por defecto), el sistema le envía un aviso por email.
*   **Cierre Automático de Salida:** Si un empleado no registra su salida tras pasar 1 hora del fin de su jornada programada, el sistema cierra la sesión automáticamente en la hora prevista.
*   **Acción:** Genera una incidencia técnica que debe ser justificada.

### C. Vigilancia de Horarios Flexibles
*   **Cierre por Exceso de Jornada:** Para evitar sesiones infinitas, el sistema cierra automáticamente los fichajes flexibles si la duración supera el objetivo diario + 5 horas, o si alcanza las 14 horas continuas.
*   **Acción:** Notifica al empleado que su sesión ha sido cerrada por seguridad.

### D. Auditoría de Ausencias Diarias
*   **Lógica:** Al finalizar la jornada prevista de cada empleado, el sistema verifica si hubo algún fichaje ese día.
*   **Acción:** Si no hay actividad y no hay una ausencia aprobada (vacaciones/baja), crea una entrada técnica con duración 0 marcada como incidencia ("Horario laboral sin fichar") y notifica al empleado.

### E. Reporte para Administradores
*   **Destinatario:** Super Administradores (`super_admin`).
*   **Acción:** Al final de cada ciclo, envía un resumen por email listando todas las acciones automáticas realizadas (avisos, cierres, incidencias creadas).

---

## 3. Automatización de Facturación
Aunque no está programada por defecto en las migraciones para evitar duplicados en desarrollo, la infraestructura está lista para la facturación mensual.

*   **Endpoint:** `/api/billing/generate`
*   **Función:**
    *   Procesa todas las empresas activas el día 1 de cada mes.
    *   Calcula el importe basado en el plan y el pico de usuarios activos del mes anterior.
    *   Genera los registros en la tabla `invoices`.

---

## 4. Tareas de Mantenimiento y Backup
Existen funciones RPC preparadas en la base de datos para copias de seguridad totales del sistema.

*   **Funciones:** `get_system_backup()` y `restore_system_backup()`.
*   **Uso:** Actualmente manual o mediante scripts externos. Permiten clonar el estado completo de la plataforma (usuarios de Auth, perfiles, fichajes y configuración) en segundos.

---

## 5. Resumen de Incidencias Automáticas
El cron es el responsable de generar los siguientes "incident_reason" que verás en el panel de gestión:
1.  *Incidencia: Fichaje olvidado de día anterior. Cierre automático de seguridad.*
2.  *Incidencia: Salida no registrada. Cierre automático del sistema.*
3.  *Incidencia: Cierre automático por exceso de jornada flexible.*
4.  *Horario laboral sin fichar.*

---
*Documento generado automáticamente por Antigravity Kit - 16/02/2026*
