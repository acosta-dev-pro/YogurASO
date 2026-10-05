# Arquitectura objetivo

Hacia dónde va YoguraSo y cómo se llega sin romper lo que funciona hoy. El orden es: estructura, diseño, interacción, migración, optimización.

## 1. Decisiones de base

| Tema | Hoy | Objetivo | Por qué |
|------|-----|----------|---------|
| Frontend | HTML/CSS/JS sin build | React + TypeScript + Vite | El hero con estado compartido (sabor, color, producto) y el panel admin son difíciles de mantener con `window.*` |
| Estilos | 7 archivos CSS con valores sueltos | Tokens CSS + Tailwind CSS | Un solo sistema de colores, espacios y radios |
| Animación | Transiciones CSS sueltas | Framer Motion para interfaz; GSAP solo si hace falta una línea de tiempo | Lo pide el plan maestro (secciones 12 a 15) |
| 3D | No hay | Opcional, después del hero 2D | El hero debe funcionar sin WebGL |
| Backend | Express + JWT + bcrypt + Multer | Supabase: Auth, Postgres con RLS y Storage | Se puede publicar sin servidor propio |
| Correos | Nodemailer con Gmail | Correo de Supabase Auth; Edge Function solo si se quiere bienvenida | Menos secretos |
| Pedido | WhatsApp | WhatsApp (sin cambios) | No inventar pagos |
| Pruebas | 4 de Playwright | Playwright por flujo crítico | Ver `docs/qa` cuando se cree |
| Publicación | GitHub Pages con `frontend/` | GitHub Pages con la carpeta `dist` de Vite | Misma plataforma |

React y TypeScript **no se instalan todavía**. Esta rama solo prepara carpetas, reglas y documentos.

## 2. Estructura de carpetas

Lo marcado con ✔ ya existe en esta rama. Lo demás se crea en las fases siguientes.

```text
YOGURASO-WEB/
├── brand/                     ✔ logos finales en SVG (por entregar)
├── public/
│   ├── products/              ✔ PNG transparentes: yoguraso-<sabor>-500ml.png
│   └── brand/                 ✔
├── assets-source/
│   └── products-raw/          ✔ fotos originales sin recortar
├── supabase/
│   ├── migrations/            ✔ 0001_schema.sql
│   ├── seed.sql               ✔
│   └── functions/             (solo si hace falta una Edge Function)
├── src/                       (fase 3 en adelante)
│   ├── components/{ui,navigation,hero,products,cart,auth,admin}/
│   ├── features/{product-showcase,product-catalog,cart,checkout,auth,profile,admin}/
│   ├── lib/{supabase,motion,utils,validation}/
│   ├── data/{products,site}/
│   ├── hooks/  styles/  types/  assets/
├── frontend/                  ✔ sitio actual; sigue vivo hasta tener paridad
├── backend/                   ✔ Express actual; sigue vivo hasta tener paridad
├── database/                  ✔ SQL actual; queda como referencia
├── docs/{architecture,design,migration,decisions,skills,qa}/
├── .cursor/{rules,commands,skills}/
└── tests/
```

Nota: el plan maestro propone `app/` con rutas y layouts. Con Vite y React Router las rutas viven en `src/`, así que `app/` no se crea salvo que se decida usar Next.js (ver ADR-001).

## 3. Cómo viaja el dato

```text
Navegador (React)
   ├── lee productos publicados  ──> Supabase REST (clave pública anon) ──> RLS permite SELECT donde is_active
   ├── Auth (correo / Google)    ──> Supabase Auth ──> fila en profiles (trigger)
   ├── admin: crear/editar       ──> Supabase REST con la sesión ──> RLS exige profiles.role = 'admin'
   ├── admin: subir imagen       ──> Storage, bucket product-images ──> política solo admin escribe
   └── comprar                   ──> arma texto ──> wa.me (sin servidor)
```

Reglas que no se negocian:

1. La clave `service_role` nunca entra en el frontend, en `public/`, en variables `VITE_*` ni en Git.
2. Ocultar un botón de admin no es seguridad: lo decide RLS.
3. Los sabores son datos (`src/data/products` y tabla `products`), no ramas `if` en quince componentes.

## 4. Modelo de producto

El plan define `Product` con: `id, slug, name, flavor, description, shortDescription, price, volume, image, backgroundColor, accentColor, category, isActive, isFeatured, sortOrder, createdAt, updatedAt`. La tabla de Supabase (`supabase/migrations/0001_schema.sql`) usa esos mismos nombres en inglés y conserva `stock`, `badge_text`, `badge_type`, `discount_percent` que la web actual ya maneja.

Los precios de la tabla actual (5.500, 4.800, 6.200, 6.500) son datos reales del proyecto y se copian a la semilla. No se inventan precios para los sabores nuevos: quedan sin fila hasta que el dueño los confirme.

## 5. Seguridad

- RLS activada en todas las tablas de `public`.
- Rol de administrador guardado en `profiles.role`, nunca en el token que el usuario pueda editar.
- Funciones `SECURITY DEFINER` con `search_path` fijo.
- Variables públicas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Nada más.
- Traducir al español los errores de Supabase antes de mostrarlos.

## 6. Orden de ejecución

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | Respaldo y rama | Hecha |
| 2 | Auditoría y documentos | Hecha |
| Previa a la 3 | Reglas de Cursor, skills, carpetas, Supabase listo (SQL, semilla, `.env.example`, cliente) | Hecha en esta rama |
| 3 | Marca y sistema de diseño | Falta |
| 4 | Hero `ProductShowcase` con Fresa, Piña y Mora | Falta; faltan los PNG recortados |
| 5 | Migración de imágenes | Falta |
| 6 | Conectar Supabase | Falta; necesita proyecto creado por el dueño |
| 7 | Pruebas de paridad | Falta |
| 8 | Retirar Express y dependencias | Falta |
