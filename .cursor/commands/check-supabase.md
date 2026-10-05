# Revisar Supabase

## Objetivo

Verificar que migraciones, RLS, Auth y Storage están bien y que no se filtra ningún secreto.

## Entradas

- Archivos de `supabase/`.
- Si hay proyecto real: acceso al panel o al CLI.

## Pasos

1. Lee `.cursor/skills/supabase/SKILL.md` y `.cursor/skills/supabase-postgres-best-practices/SKILL.md`.
2. Confirma que cada tabla de `public` tiene `enable row level security` y al menos una política que tenga sentido.
3. Confirma que lo público solo lee lo publicado (`is_active`) y que escribir exige `is_admin()`.
4. Confirma que el rol nunca sale de metadatos que manda el navegador.
5. Corre `git grep -n -i service_role` y `git grep -n -i "eyJ"`: no debe haber coincidencias en el frontend ni en `public/`.
6. Revisa que `.env` no está versionado y que `.env.example` solo tiene marcadores.
7. Si hay una base disponible, prueba las políticas como anónimo, cliente y admin.
8. Anota en `docs/migration/NODE_TO_SUPABASE.md` cualquier política nueva o cambiada.

## Criterios de éxito

- Ninguna tabla expuesta sin RLS.
- Pruebas de acceso de los tres roles con el resultado esperado.
- Cero claves secretas en el repositorio.

## Archivos que puede modificar

- `supabase/migrations/` (solo con una migración nueva)
- `supabase/seed.sql`
- `docs/migration/*.md`
- `src/lib/supabase/`

## Archivos que no puede modificar

- Migraciones ya aplicadas
- `.env`
- `backend/` y `database/` mientras no haya paridad
