# Revisar accesibilidad

## Objetivo

Comprobar la accesibilidad de una pantalla contra la lista del proyecto.

## Entradas

- Página o componente.
- Lista: `.cursor/rules/05-accessibility.mdc`.

## Pasos

1. Revisa la estructura: un `h1`, regiones semánticas, orden de encabezados.
2. Revisa que toda acción sea un `<button>` y toda navegación un `<a>`.
3. Revisa `alt`, `label` y nombres accesibles.
4. Recorre la página solo con teclado: foco visible, orden lógico, Esc cierra menús y cajones, el foco vuelve al botón de origen.
5. Mide el contraste de cada color de sabor con su texto.
6. Prueba con `prefers-reduced-motion` activado.
7. Corre la prueba de accesibilidad de Playwright si existe.
8. Anota los problemas con ruta y línea.

## Criterios de éxito

- Sin violaciones graves ni críticas.
- Todo el flujo de compra se puede hacer con teclado.
- Lista guardada en `docs/qa/ACCESSIBILITY_CHECKLIST.md`.

## Archivos que puede modificar

- `docs/qa/ACCESSIBILITY_CHECKLIST.md`
- Marcado y estilos del componente revisado

## Archivos que no puede modificar

- `supabase/`
- `backend/`
