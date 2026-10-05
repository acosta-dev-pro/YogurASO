# ADR-001: Modernización del proyecto YoguraSo

- **Estado:** propuesta, a la espera de aprobación del dueño
- **Fecha:** 4 de octubre de 2026
- **Rama:** `redesign/yoguraso-v2`

## Contexto

La web actual es HTML, CSS y JavaScript sin build, con una API Node/Express y PostgreSQL local. Funciona en local, pero:

- GitHub Pages publica solo `frontend/`, y `config.js` apunta a `localhost:3000`, así que el sitio publicado no puede cargar productos ni iniciar sesión.
- El rediseño pedido (hero con cambio de sabor, color de fondo por sabor, transiciones coordinadas, panel admin nuevo) necesita estado compartido entre varios elementos. Con variables globales en `window` y HTML armado con texto, cada cambio toca muchos archivos.
- La autenticación propia (JWT en `localStorage`, bcrypt, recuperación por correo con Nodemailer) es código que hay que mantener y asegurar.

## Decisión

1. **Rediseñar en una rama aparte**, con respaldo comprimido y sin tocar `main`.
2. **Hacerlo en este orden:** estructura, sistema de diseño, hero, productos, responsive, movimiento, Supabase, RLS, paridad, pruebas, retiro de lo viejo.
3. **Frontend nuevo en React + TypeScript + Vite**, con Tailwind y tokens CSS, Framer Motion para la interfaz. GSAP y Three.js solo si un caso concreto lo justifica.
4. **Backend: Supabase** (Auth, PostgreSQL con RLS, Storage). Una Edge Function para desactivar usuarios de verdad. El pedido sigue saliendo por WhatsApp.
5. **Node/Express sigue funcionando hasta pasar la paridad.** Se retira al final, no antes.
6. **Borrar solo lo que se pruebe sin uso**, con `git rm` por categorías y una lista en `docs/architecture/ELIMINADOS.md`.

## Alternativas consideradas

| Opción | Por qué no |
|--------|-----------|
| Seguir con JS puro | El hero y el admin se vuelven difíciles de mantener; no hay tipos ni build |
| Next.js | Añade servidor y SSR que la tienda no necesita; GitHub Pages es estático. Se reconsidera si más adelante se quiere SEO por producto con renderizado en servidor |
| Mantener Express y solo desplegarlo | Obliga a pagar, asegurar y vigilar un servidor y una base de datos |
| Firebase | Es válido, pero el proyecto ya está en PostgreSQL y el plan maestro pide Supabase |
| Reescribir todo de una vez | Riesgo alto de perder funciones; el plan exige puntos de recuperación |

## Consecuencias

**Buenas**
- El sitio se puede publicar completo en un hosting estático más Supabase.
- Menos código propio de seguridad.
- Los sabores pasan a ser datos.

**Malas o a vigilar**
- Hay que aprender React/TypeScript y Supabase; el aprendizaje es parte del costo.
- Las cuentas actuales no se pueden migrar con su clave (bcrypt local); se pide restablecerla.
- Se pierde, mientras dure la migración, la posibilidad de abrir la web con solo `npx serve frontend` (el sitio nuevo necesitará `npm run dev`).
- Dependencia de un servicio externo (Supabase) y de su plan gratuito.

## Cómo saber que salió bien

- `npm install`, `npm run build` y `npm test` sin errores.
- Los 12 flujos de la fase 7 pasan: registro, login, logout, recuperar, Google, perfil, productos, carrito, WhatsApp, admin, imágenes y responsive.
- Ningún secreto en Git; `git grep service_role` sin coincidencias en el frontend.
