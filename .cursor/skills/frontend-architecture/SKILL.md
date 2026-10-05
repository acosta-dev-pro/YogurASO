---
name: frontend-architecture
description: Organización de carpetas, capas y datos del frontend de YoguraSo. Úsala al crear módulos, mover archivos o decidir dónde va algo.
---

# Arquitectura frontend

## Cuándo usarla

Al crear un módulo nuevo, mover código, o decidir si algo es componente, feature, hook o librería.

## Reglas

- La estructura objetivo está en `docs/architecture/TARGET_ARCHITECTURE.md`. Respétala.
- `components/ui` no sabe nada del negocio. `features/*` agrupa pantalla, hooks y lógica de una funcionalidad. `lib/*` habla con servicios.
- Los sabores son datos en `src/data/products`. Ningún componente decide por nombre de sabor.
- El acceso a Supabase se hace solo desde `src/lib/supabase`; los componentes reciben datos o hooks.
- Sin estado global en `window`. Estado local primero; contexto solo cuando varios árboles lo necesitan.
- Un archivo que supera ~250 líneas se divide. Una función hace una cosa.
- Antes de crear algo, busca si ya existe (`rg`/`git grep`).
- Mueve con `git mv` y actualiza `YOGURASO_PROJECT_MAP_V2.md`.

## Cómo trabajar

1. Ubica el archivo en el mapa del proyecto.
2. Elige la carpeta por responsabilidad, no por comodidad.
3. Define el tipo de datos primero.
4. Actualiza el mapa si cambió la estructura.

## Revisión final

- [ ] Sin imports circulares.
- [ ] Sin lógica de sabor repetida.
- [ ] Cada carpeta nueva está en TARGET_ARCHITECTURE.md.
- [ ] El mapa está al día.
