# Skills de YoguraSo

Una *skill* es un paquete de instrucciones que el agente de código lee cuando la tarea lo pide. Aquí están las que usa este proyecto, de dónde salen y cómo se revisan.

## Cómo está instalado

- Cursor lee las skills desde `.cursor/skills/<nombre>/SKILL.md` dentro del proyecto. Por eso quedan en el repositorio y las usa quien lo clone.
- **No se instaló ningún paquete npm** ni ninguna herramienta global. Las oficiales se descargaron con `git clone` y se copiaron sin cambios, con su licencia y un archivo `SOURCE.md` que dice repositorio, ruta, commit y fecha.
- No hay duplicados: cada área tiene una sola skill.

## Resumen

| # | Área | Skill | Origen | Página |
|---|------|-------|--------|--------|
| 1 | UI/UX | `ui-ux-design` + `frontend-design` | Local + oficial de Anthropic | [01-ui-ux.md](01-ui-ux.md) |
| 2 | Arquitectura frontend | `frontend-architecture` | Local | [02-arquitectura-frontend.md](02-arquitectura-frontend.md) |
| 3 | React y TypeScript | `react-typescript` | Local | [03-react-typescript.md](03-react-typescript.md) |
| 4 | Tailwind CSS | `tailwind-css` | Local | [04-tailwind.md](04-tailwind.md) |
| 5 | Accesibilidad | `accessibility` | Local | [05-accesibilidad.md](05-accesibilidad.md) |
| 6 | Rendimiento | `web-performance` | Local | [06-rendimiento.md](06-rendimiento.md) |
| 7 | SEO | `seo` | Local | [07-seo.md](07-seo.md) |
| 8 | Supabase | `supabase` y `supabase-postgres-best-practices` | Oficial de Supabase | [08-supabase.md](08-supabase.md) |
| 9 | Movimiento | `motion-design` | Local | [09-movimiento.md](09-movimiento.md) |
| 10 | Three.js / R3F | `threejs-r3f` | Local | [10-threejs-r3f.md](10-threejs-r3f.md) |
| 11 | Playwright | `playwright-cli` | Oficial de Microsoft | [11-playwright.md](11-playwright.md) |
| 12 | Git y revisión | `git-code-review` | Local | [12-git-revision.md](12-git-revision.md) |

## Skills oficiales copiadas

| Skill | Repositorio | Licencia | Se revisó |
|-------|-------------|----------|-----------|
| `supabase` | github.com/supabase/agent-skills | MIT | Sí: instrucciones y referencias; no ejecuta scripts |
| `supabase-postgres-best-practices` | github.com/supabase/agent-skills | MIT | Sí: solo documentos |
| `frontend-design` | github.com/anthropics/skills | Apache 2.0 | Sí: un solo `SKILL.md` |
| `playwright-cli` | github.com/microsoft/playwright-cli | Apache 2.0 | Sí: documentos de uso; sugiere instalar un paquete, que **no** se instaló |

Cada carpeta lleva `SOURCE.md` con el commit exacto. Para actualizar una, se vuelve a clonar y se compara; no se actualizan solas.

## Skills escritas para el proyecto

Diez, cortas y específicas de YoguraSo: `ui-ux-design`, `frontend-architecture`, `react-typescript`, `tailwind-css`, `accessibility`, `web-performance`, `seo`, `motion-design`, `threejs-r3f`, `git-code-review`. Cada una trae cuándo usarla, reglas, forma de trabajar y una lista final. Se apoyan en `docs/design/PLAN_MAESTRO_REDISENO.md`.

Las reglas de `.cursor/rules/` fijan lo que siempre se cumple; las skills explican cómo hacer cada tipo de tarea.

## Skills de la comunidad que se podrían añadir después (no instaladas)

Existen y se comprobó que los repositorios son públicos, pero **no** se copiaron. Antes de instalar cualquiera: leer su `SKILL.md` completo, revisar si trae scripts, mirar la licencia y fijar el commit.

| Skill | Repositorio | Para qué serviría | Cuidado |
|-------|-------------|-------------------|---------|
| UI UX Pro Max | github.com/nextlevelbuilder/ui-ux-pro-max-skill | Reglas de estilos, paletas y tipografías para diseño de interfaz (es el "UI/UX Design Intelligence" del plan) | Licencia MIT. Trae una herramienta en Python y un instalador por npm; revisar antes de ejecutar. Sus sugerencias de estilo pueden chocar con la marca |
| web-quality-skills | github.com/addyosmani/web-quality-skills | Auditorías de rendimiento, Core Web Vitals, accesibilidad y SEO con Lighthouse | Licencia MIT; no oficial. Algunas funciones piden Chrome DevTools MCP |
| agent-skills de Vercel | github.com/vercel-labs/agent-skills | `react-best-practices`, `composition-patterns`, `web-design-guidelines` | Varias están pensadas para Next.js y Vercel; elegir solo las de React y diseño |
| `webapp-testing` | github.com/anthropics/skills | Pruebas de aplicaciones web | Ya se cubre con Playwright |

Cuándo conviene: después de la fase 3, si se nota que el diseño o la auditoría de calidad necesitan más guía que las skills locales.

## Cómo se revisa que sirven

1. Una skill no se da por buena hasta usarla en una tarea real y ver que el resultado cumple su lista final.
2. Si una skill contradice las reglas del proyecto (`.cursor/rules/`) o el plan maestro, gana el proyecto.
3. Si una skill pide instalar algo, enviar algo a internet o abrir un servidor, se pregunta antes.
