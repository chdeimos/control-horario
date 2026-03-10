# Protocolo de Cumplimiento Legal (Inspección de Trabajo)

Este documento detalla cómo la aplicación **Control Horario** cumple con la normativa española (Real Decreto-ley 8/2019) y qué debes mostrar ante una inspección de trabajo.

## 1. Los 4 Pilares del Cumplimiento en la App

### A. Registro Diario de Jornada (Obligatorio)
La ley exige registrar la hora de inicio y fin de cada jornada.
- **En la App**: Cada vez que un empleado ficha (web, móvil o hardware), queda registrado con fecha, hora exacta y geolocalización (si aplica). Estos datos son inalterables en su origen.

### B. Disponibilidad Inmediata
Los registros deben estar disponibles en el centro de trabajo.
- **Cómo demostrarlo**: En la sección **Gestión > Informes**, puedes generar en segundos el informe de cualquier mes para cualquier empleado o grupo de empleados.

### C. Garantía de Integridad y Auditoría
La ley permite correcciones, pero no la manipulación arbitraria. Si se cambia algo, debe haber un rastro.
- **En la App**: Cualquier edición manual (como la que acabamos de corregir) requiere un **Motivo**. 
- **Prueba**: Los informes PDF incluyen un **Anexo de Incidencias** y marcan con un asterisco `(*)` los fichajes que han sido modificados. Esto demuestra transparencia ante el inspector.

### D. Conservación de Datos (4 años)
- **En la App**: Todos los datos se almacenan de forma persistente en la base de datos (Supabase/Postgres). No se borran al finalizar el mes.

---

## 2. Instrucciones para una Inspección

Si un inspector te solicita los registros, sigue estos pasos:

1.  Ve a la sección **Gestión > Informes**.
2.  Selecciona el **Mes** y el **Año** solicitado.
3.  Selecciona a los empleados (o "Todos").
4.  Pulsa en **Descargar ZIP**.
5.  **Entrega los PDFs**: Cada PDF contiene:
    - Datos del trabajador y la empresa (NIF/CIF).
    - Tabla detallada de entradas, salidas y total de horas.
    - Espacio para firma (se recomienda que los empleados firmen el PDF impreso o digitalmente cada mes).
    - **Anexo de Auditoría**: Donde se listan los cambios manuales y sus motivos.

---

## 3. Recomendación de Seguridad
Aunque la app guarda todo, la ley recomienda que los registros sean validados por el trabajador. 
> [!TIP]
> Te recomendamos descargar los informes mensualmente y pedir a los empleados que los firmen. Esto cierra el círculo de seguridad legal ante cualquier reclamación.
