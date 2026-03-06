---
name: gestor_github
description: Ayuda a subir y actualizar proyectos en GitHub automáticamente usando un flujo básico de git.
---

# Gestor de GitHub

Esta habilidad permite al agente realizar operaciones básicas de Git para subir y actualizar proyectos en GitHub.

## Cuándo usar esta habilidad

Utiliza esta habilidad cuando el usuario pida:
- Subir el proyecto a GitHub.
- Actualizar el repositorio.
- "Hacer un push" o "Guardar cambios en la nube".

## Instrucciones

Sigue este flujo de trabajo estándar para actualizar el repositorio:

1.  **Verificar estado**:
    -   Ejecuta `git status` para ver qué cambios hay pendientes.

2.  **Añadir cambios**:
    -   Ejecuta `git add .` para incluir todos los cambios.

3.  **Confirmar cambios (Commit)**:
    -   Pregunta al usuario por un mensaje para el commit si no lo ha proporcionado.
    -   Si el usuario no especifica mensaje, usa uno descriptivo basado en los cambios (ej: "Actualización automática: mejoras en X").
    -   Ejecuta `git commit -m "mensaje"`.

4.  **Subir cambios (Push)**:
    -   Ejecuta `git push`.

## Manejo de Errores

-   Si `git push` falla por falta de upstream, sugiere o ejecuta: `git push --set-upstream origin main` (o la rama actual).
-   Si hay conflictos, infórmale al usuario y NO fuerces el push (`--force`) a menos que sea explícitamente solicitado.
