# Guía de Estilo y Diseño: Control Horario Web (Stitch Edition)

Esta guía define los principios estéticos y técnicos derivados de los nuevos diseños generados en **Stitch**. Estos lineamientos aseguran una transición fluida desde el prototipo hasta la implementación real en **Control Horario Web**.

---

## 1. Identidad Visual y Colores

El diseño evoluciona hacia una estética **Professional Elegant**, priorizando la claridad HD, la saturación equilibrada y una estructura de datos impecable.

### Paleta de Colores (Stitch Design)
- **Primario (Branding Blue)**: `#3b60c1`. El color core de la marca. Se utiliza para banners, botones principales y acentos de navegación.
- **Hover/Active (Deep Blue)**: `#2d4a94`. Estado de interacción para el color primario.
- **Contraste y Énfasis**: Uso de una saturación de nivel 3 para destacar elementos interactivos sin abrumar la vista.
- **Fondos Interfaz**:
  - `bg-white`: Superficies de tarjetas y paneles de contenido.
  - `bg-slate-50`: Fondos de página para generar separación visual tras las tarjetas.
- **Estados Semánticos**:
  - **Success**: Emerald green suave para registros correctos.
  - **Warning/Pending**: Amber/Orange para incidencias o revisiones.
  - **Error/Destructive**: Rose/Red para alertas críticas o bloqueos.

---

## 2. Geometría y Estructura (Design Tokens)

### El "Stitch Radius" (Round Eight)
- **Bordes Estándar**: Toda la interfaz debe utilizar un `border-radius` de **8px** (`rounded-lg` en Tailwind). Esto sustituye al radio de 5px anterior para lograr un aspecto más moderno y amable.
- **Contenedores**: Las tarjetas principales deben tener bordes definidos de 8px y un sutil borde de color `border-slate-100`.

### Sombras y Elevación
- **Soft HD Shadows**: Sombras muy difusas con baja opacidad (`shadow-xl shadow-slate-200/40`).
- **Separación**: Uso de bordes ligeros en lugar de sombras fuertes para mantener la elegancia profesional.

---

## 3. Tipografía (Manrope System)

### Fuente Principal
- **Familia**: **Manrope** (`font-manrope`). Es la fuente obligatoria para toda la interfaz, proporcionando un equilibrio perfecto entre lo técnico y lo moderno.

### Jerarquía Tipográfica
- **Títulos de Sección**: `font-extrabold` o `font-bold` con `tracking-tight` para una presencia fuerte.
- **Cuerpo de Datos**: `font-medium` para valores numéricos y nombres de empleados, mejorando la legibilidad en tablas.
- **Labels y Micro-texto**: `text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500`. 
- **Tabular Nums**: Obligatorio para cualquier visualización de horas, fechas o duraciones.

---

## 4. Componentes y Layout

### Dashboard (Professional Redesign)
- **Layout**: Uso de espacios generosos (`gap-8` o `gap-10`) entre widgets.
- **Widgets**: Cada widget debe ser un contenedor blanco independiente con el nuevo radio de 8px.

### Tablas de Registros (Elegant History)
- **Cabeceras**: Fondo `bg-slate-50/50` con texto en gris medio.
- **Filas**: Altura confortable, con efectos de `hover:bg-slate-50/30` sutiles.
- **Iconografía**: Uso de iconos de **Lucide React** con un trazo fino (`stroke-width: 1.5` o `2`).
- **Optimización de Ancho (Anti-Scroll)**:
  - **Layout Fijo**: Las tablas de gestión deben usar la clase `table-fixed` junto con `w-full` para garantizar que no se genere scroll horizontal y que el navegador respete los anchos definidos.
  - **Columnas de Metadatos**: Asignar anchos fijos a columnas de datos cortos (ej: Empleado `w-[200px]`, Fecha `w-[120px]`, Horario `w-[150px]`).
  - **Columnas de Contenido**: Dejar una sola columna sin ancho definido (normalmente descripción o motivo) para que absorba el espacio restante. Usar `line-clamp-2` para mantener la altura de fila controlada.
  - **Consolidación de Datos**: Agrupar badges y timestamps en una sola celda para maximizar el espacio.
  - **Tabular Nums**: Uso obligatorio del estilo `tabular-nums` en todas las celdas con datos temporales o numéricos.

### Cabeceras de Card/Sección
Este patrón debe usarse para titular bloques de contenido dentro de tarjetas:
- **Contenedor**: Padding `p-8` con fondo `bg-slate-50/50` y borde inferior `border-b border-slate-100`.
- **Estructura**:
  - **Barra Decorativa**: Un marcador vertical de `h-6 w-1 rounded-full` a la izquierda del título. El color debe ser semántico (ej: `bg-amber-500` para solicitudes, `bg-blue-500` para listados generales).
  - **Título**: `text-sm font-black uppercase tracking-widest text-slate-900`.

### Patrón de Cabecera Full-Width (PandoraSoft Style)
Para apartados que requieran un impacto visual premium (ej: Gestión, Mis Fichajes):
- **Contenedor Padre (Layout)**: Debe ser `w-full` sin restricciones de `max-w` para que el banner cubra todo el ancho en pantallas ultra-wide (>1600px).
- **Contenedor Externo (Componente)**: Debe anular el padding del layout mediante márgenes negativos (`md:-m-12`).
- **Estructura del Banner**:
  - Fondo: `bg-[#3b60c1]`.
  - Padding Superior: `pt-16` para evitar que el título toque el borde.
  - Padding Inferior: `pb-24` para permitir el solapamiento de tarjetas.
- **Tipografía Estandarizada**:
  - **Título**: `text-3xl font-bold tracking-tight text-white`. Mantener consistencia en todas las páginas.
  - **Subtítulo**: `text-base font-medium text-blue-100/80`. Máximo `max-w-2xl` para legibilidad.
- **Botones en Banner (Glassmorphism)**: Los botones dentro del banner azul deben usar un estilo integrado:
  - Fondo: `bg-white/10` con `backdrop-blur-md`.
  - Borde: `border-white/20`.
  - Tipografía: `text-[10px] font-bold uppercase tracking-widest`.
  - Animación: `hover:-translate-y-0.5 transition-all`.

### Pestañas de Sección (Underline Style)
Para la navegación interna de páginas con banner azul (ej: Mi Perfil, Configuración):
- **Estructura (TabsList)**:
  - Fondo: `bg-transparent` (sin bloque gris).
  - Borde Inferior: `border-b border-white/20` (una línea sutil que cruza todo el ancho).
  - Alineación: `justify-start` con un gap generoso (`gap-8`).
- **Estados de Pestaña (TabsTrigger)**:
  - **Inactivo**: Texto `text-blue-100/60`, sin fondo, `rounded-none`.
  - **Activo**: Texto `text-white`, borde inferior `border-b-2 border-white`.
  - **Hover**: Siempre `text-white` para maximizar la visibilidad sobre el fondo oscuro.
  - **Tipografía**: `text-[11px] font-black uppercase tracking-[0.2em]`.
  - **Interacción**: Animación sutil con `transition-all`.

### Filtros y Controles de Gestión
Para mantener la jerarquía y uniformidad visual en las barras de herramientas de gestión:
- **Altura Uniforme**: Todos los inputs de búsqueda, selectores (`SelectTrigger`) y elementos con `role="combobox"` deben tener una altura obligatoria de `h-12` (48px).
- **Esquinas**: Usar siempre `rounded-lg` (8px).
- **Tipografía Filtros**: Labels en `text-[10px] font-black uppercase tracking-[0.2em] text-slate-400`.
- **Colores de Estado en Filas (Ausencias)**: Para facilitar el escaneo visual de solicitudes:
  - **Pendiente**: Fondo `bg-amber-50/40`.
  - **Aprobada**: Fondo `bg-emerald-50/40`.
  - **Rechazada**: Fondo `bg-rose-50/40`.
- **Contenido Flotante**: El siguiente bloque de contenido debe subir sobre el banner mediante un margen negativo superior (`-mt-12`), contenido dentro de un `max-w-7xl mx-auto` para mantener la información centrada.

---

## 5. Navegación SaaS (App-Like Experience)

Para asegurar una experiencia de usuario fluida y coherente entre el fichaje y la gestión, se establece un sistema de navegación dual:

### Navegación Lateral (Desktop Sidebar)
- **Ancho Fijo**: **w-80** (320px). Esto proporciona un área de interacción amplia y profesional.
- **Jerarquía de Secciones**:
  - Labels de sección: `text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4`.
  - Padding de enlaces: `px-6 py-4` (confortable para navegación constante).
- **Estados Visuales**:
  - **Activo**: Fondo `bg-blue-50` y texto `text-[#3b60c1]`.
  - **Inactivo**: Texto `text-slate-400` con `hover:text-slate-900` y `hover:bg-slate-50`.
  - **Aviso (Incidencias)**: Texto `text-amber-500` con `hover:bg-amber-50/50`.
- **Micro-interacciones**: Escalado suave de iconos con `group-hover:scale-110 transition-transform`.

### Navegación Móvil (App Experience)
- **Header Corporativo**:
  - Fondo: Blanco puro (`bg-white`).
  - Barra de Información: Una franja azul (`bg-[#3b60c1]`) justo debajo del logo que muestra contexto (ej: Fecha, Horario o Modo Administración).
- **Barra Inferior (Bottom Nav)**:
  - Fondo: Negro Azulado (`bg-[#0f172a]`).
  - Altura: `h-20`.
  - Efecto de Enfoque: Iconos activos en azul branding con sombra de resplandor (`drop-shadow-[0_0_8px_rgba(59,96,193,0.5)]`).
  - Opacidad: Enlaces inactivos al 40% para maximizar el foco en la sección actual.

---

## 6. Mobile & Responsive

Aunque el enfoque principal de este diseño es Desktop, se debe mantener la coherencia adaptativa:
- **Radio de 8px**: Se mantiene constante en móvil.
- **Botones de Acción**: Altura mínima de `48px` para garantizar la facilidad de uso táctil.
- **Fichaje**: El tracker circular mantiene su centralidad pero hereda la fuente Manrope.

---

## Checklist de Validación (Referencia Rápida)
- [ ] ¿La fuente utilizada es **Manrope**?
- [ ] ¿El color primario es **#3b60c1**?
- [ ] ¿Todos los bordes (excepto círculos) son de **8px** (`rounded-lg`)?
- [ ] ¿La saturación de los colores de estado es coherente con el nivel 3 de Stitch?
- [ ] ¿Las tablas utilizan la estructura "Elegant History" definida?
- [ ] ¿Los números críticos usan `tabular-nums`?
