# Skill: Supabase

**Tipo:** oficial, copiada tal cual desde el repositorio de Supabase.
**Archivos:** `.cursor/skills/supabase/` y `.cursor/skills/supabase-postgres-best-practices/`
**Origen:** https://github.com/supabase/agent-skills (licencia MIT; commit y fecha en cada `SOURCE.md`)

## Qué cubre

- `supabase`: Auth, base de datos, Storage, Edge Functions, RLS, la CLI, el servidor MCP, errores comunes y seguridad. Pide consultar la documentación oficial antes de diagnosticar errores en vez de responder de memoria.
- `supabase-postgres-best-practices`: esquema, tipos de columna, migraciones, políticas RLS, índices, conexiones y bloqueos. Se aplica aunque sea una sola columna.

## Cuándo se usa

Al tocar cualquier cosa dentro de `supabase/`, al escribir políticas, al conectar Auth o Storage y al revisar con el comando `check-supabase`.

## Reglas del proyecto que la complementan

- `.cursor/rules/07-supabase.mdc` y `.cursor/rules/08-security.mdc`.
- `docs/migration/NODE_TO_SUPABASE.md` es el mapa de equivalencias.
- `supabase/migrations/0001_schema.sql` ya sigue estas prácticas: RLS en todas las tablas, `(select auth.uid())` dentro de las políticas, funciones con `search_path` fijo, índices en claves foráneas.

## Notas

- La skill incluye un archivo `references/skill-feedback.md` que, **solo si la persona lo acepta**, redacta un reporte para los mantenedores en GitHub. No envía nada sola.
- La skill menciona el servidor MCP de Supabase. No está configurado en este proyecto; hacerlo es decisión del dueño y exige un token con permisos acotados.

## Lista de comprobación

- [ ] Toda tabla de `public` con RLS.
- [ ] Ninguna clave `service_role` fuera de los secretos de las Edge Functions.
- [ ] Migraciones nuevas, nunca editar las aplicadas.
- [ ] Errores traducidos al español.
