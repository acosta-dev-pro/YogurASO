# Preparar la migración a Supabase

## Objetivo

Dejar listo un bloque de la migración Node a Supabase sin tocar lo que funciona hoy.

## Entradas

- Bloque: base de datos, Auth, productos, Storage o admin.
- `docs/migration/NODE_TO_SUPABASE.md`.

## Pasos

1. Confirma la rama y que hay un punto de recuperación (commit o zip).
2. Lee la tabla de equivalencias del bloque en `NODE_TO_SUPABASE.md`.
3. Escribe la migración SQL o el servicio en `src/lib/supabase/` **al lado** del código actual.
4. Escribe primero la prueba de paridad del bloque con el comportamiento de hoy.
5. Corre `check-supabase` y `run-tests`.
6. Deja Node funcionando como respaldo. No retires nada.
7. Actualiza el documento con lo hecho, lo probado y lo que falta.

## Criterios de éxito

- El bloque funciona con Supabase y con Node por separado.
- La prueba de paridad pasa en ambos.
- `NODE_TO_SUPABASE.md` actualizado.

## Archivos que puede modificar

- `supabase/**`
- `src/lib/supabase/**`
- `docs/migration/**`
- `tests/**`

## Archivos que no puede modificar

- `backend/**` y `database/**` (se retiran solo en la fase 8)
- `frontend/js/api.js` hasta la paridad
- .env y cualquier secreto
