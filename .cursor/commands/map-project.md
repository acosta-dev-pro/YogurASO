# Mapear el proyecto

## Objetivo

Mantener actualizados el mapa del proyecto y el mapa de dependencias.

## Entradas

- Resultado de la última auditoría.
- Cambios hechos desde el último mapa (`git log`).

## Pasos

1. Lee `docs/architecture/YOGURASO_PROJECT_MAP_V2.md` y `DEPENDENCY_MAP.md`.
2. Compara con el árbol real (`git ls-files`) y busca archivos nuevos, movidos o borrados.
3. Actualiza el inventario: ruta, propósito, dependencias, dependencias inversas, estado, destino y riesgo.
4. Actualiza rutas, flujos y deuda técnica.
5. Lista el código muerto, pero no lo borres aquí.

## Criterios de éxito

- El mapa coincide con el árbol real.
- Cada archivo nuevo aparece con su estado y su riesgo.
- No quedan rutas inexistentes en el documento.

## Archivos que puede modificar

- `docs/architecture/*.md`

## Archivos que no puede modificar

- Código fuente, `supabase/`, `database/`
