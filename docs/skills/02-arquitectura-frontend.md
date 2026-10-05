# Skill: Arquitectura frontend

**Tipo:** escrita para este proyecto (local).
**Archivo:** `.cursor/skills/frontend-architecture/SKILL.md`

## Qué cubre

Organización de carpetas, capas y datos del frontend de YoguraSo. Úsala al crear módulos, mover archivos o decidir dónde va algo.

## Cuándo se usa

Al crear un módulo nuevo, mover código, o decidir si algo es componente, feature, hook o librería.

## Reglas principales

- La estructura objetivo está en `docs/architecture/TARGET_ARCHITECTURE.md`. Respétala.
- `components/ui` no sabe nada del negocio. `features/*` agrupa pantalla, hooks y lógica de una funcionalidad. `lib/*` habla con servicios.
- Los sabores son datos en `src/data/products`. Ningún componente decide por nombre de sabor.
- El acceso a Supabase se hace solo desde `src/lib/supabase`; los componentes reciben datos o hooks.
- Sin estado global en `window`. Estado local primero; contexto solo cuando varios árboles lo necesitan.

## Lista de comprobación

- [ ] Sin imports circulares.
- [ ] Sin lógica de sabor repetida.
- [ ] Cada carpeta nueva está en TARGET_ARCHITECTURE.md.
- [ ] El mapa está al día.
