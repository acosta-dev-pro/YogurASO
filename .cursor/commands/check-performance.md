# Revisar rendimiento

## Objetivo

Medir peso y velocidad antes de dar una fase por cerrada.

## Entradas

- URL local de la web (por ejemplo `http://127.0.0.1:4173`).
- Páginas a medir.

## Pasos

1. Lista el peso de `public/` y de las imágenes (`Get-ChildItem -Recurse | Sort-Object Length -Descending`).
2. Marca toda imagen sobre ~300 KB que no esté justificada.
3. Revisa que las imágenes tengan `width`, `height` y `loading="lazy"` fuera de la primera pantalla.
4. Revisa que solo se cargan Fredoka y Nunito Sans, con `font-display: swap`.
5. Revisa que Three.js, sonido y admin no se cargan fuera de su ruta.
6. Corre Lighthouse en móvil y escritorio y anota rendimiento, LCP, CLS y TBT.
7. Anota el tamaño del bundle.

## Criterios de éxito

- LCP menor a 2,5 s en móvil simulado.
- CLS menor a 0,1.
- Sin imágenes grandes sin justificar.
- Informe guardado en `docs/qa/PERFORMANCE_CHECKLIST.md`.

## Archivos que puede modificar

- `docs/qa/PERFORMANCE_CHECKLIST.md`
- Imágenes y carga de recursos (si el usuario lo pide)

## Archivos que no puede modificar

- Lógica de negocio
- `supabase/`
