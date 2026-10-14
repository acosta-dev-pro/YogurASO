# Mapa del proyecto YogurASO — versión 2

Fecha de la auditoría: 4 de octubre de 2026.
Actualización del 9 de octubre de 2026: la web ya no usa Express. Los datos van a Supabase desde `frontend/js/api.js` y `frontend/js/api/`. El documento para la exposición está en `docs/modulos.md`.

Rama de trabajo: `redesign/yoguraso-v2` (creada desde `main`, commit `1e49cba`).
Copia de seguridad previa: `C:\Users\acost\Desktop\YOGURASO-BACKUP-2026-10-04.zip`.

Este mapa describe cómo está el proyecto **hoy**. Sirve de base para el rediseño y para pasar de Node/PostgreSQL a Supabase. Para saber qué se borró y por qué, mira `ELIMINADOS.md`.

## Resumen en una mirada

| Capa | Hoy | Archivos |
|------|-----|----------|
| Frontend | HTML + CSS + JavaScript puro, sin framework ni bundler | 9 páginas HTML + `index.html` + `404.html`, 7 CSS, 9 JS |
| API | Node.js + Express 4 | `backend/server.js` + 3 rutas, 3 controladores, 2 middlewares, 1 servicio de correo |
| Base de datos | PostgreSQL local (7 tablas) | `database/*.sql` |
| Sesión | JWT de 8 horas guardado en `localStorage` | `frontend/js/auth.js`, `api.js` |
| Compra | Carrito en `localStorage`, el pedido sale por WhatsApp | `frontend/js/cart.js` |
| Imágenes de producto | URL externa (ibb.co) o archivo subido con Multer a `backend/uploads/` | `server.js` |
| Publicación | GitHub Pages publica solo `frontend/` desde `main` | `.github/workflows/pages.yml` |
| Pruebas | Playwright, 4 pruebas en 2 archivos | `tests/` |

Detalle importante: en GitHub Pages solo se sube `frontend/`, pero `config.js` apunta a `http://localhost:3000/api`. Es decir, el sitio publicado no puede hablar con ninguna API. Es una de las razones para pasar a Supabase.

## A. Inventario por archivo

Leyenda de las columnas: **Estado** = activo / duplicado / sin uso. **Destino** = mantener, migrar (cambia de lugar o de tecnología), reemplazar (lo sustituye algo nuevo) o eliminar. **Riesgo** = riesgo de tocarlo.

### A.1 Raíz

| Ruta | Para qué sirve | Depende de | Lo usan | Estado | Destino | Riesgo |
|------|----------------|------------|---------|--------|---------|--------|
| `package.json` | Scripts `dev`, `start`, `test`; Playwright como dependencia de desarrollo | `backend/`, Playwright | Todo el flujo local | Activo | Mantener y ampliar | Medio |
| `package-lock.json` | Versiones fijas de Playwright | `package.json` | `npm install` | Activo | Mantener | Bajo |
| `playwright.config.js` | Levanta `npx serve frontend` en el puerto 4173 y corre `tests/` | `tests/`, `frontend/` | `npm test` | Activo | Mantener | Bajo |
| `README.md` | Guía de arranque local | — | Personas | Activo, desactualizado tras el rediseño | Reescribir al final | Bajo |
| `INICIAR-YOGURASO.bat` | Abre la API y el frontend en Windows (puertos 3000 y 5500) | `backend/`, `frontend/` | Uso manual | Activo | Mantener hasta que Supabase reemplace la API | Bajo |
| `ABRIR-YOGURASO-AA5.bat` | Abría la web en una máquina virtual Ubuntu con Docker | `scripts/ubuntu-auto-docker-raro.ps1` | Nadie | Sin uso | Eliminado | Bajo |
| `.gitignore` | Ignora `.env`, `node_modules`, `uploads`, `backup/` | — | Git | Activo | Mantener | Bajo |
| `.github/workflows/pages.yml` | Publica `frontend/` en GitHub Pages al hacer push a `main` | `frontend/` | GitHub | Activo | Mantener (ajustar cuando haya build) | Alto |

### A.2 Frontend (`frontend/`)

Páginas. Todas cargan `css/styles.css`, `css/shop-ui.css`, `css/header.css`, `js/config.js`, `js/utils.js`, `js/nav.js`, `js/cart.js` y `js/auth.js`. Debajo solo se anota lo que cambia en cada una.

| Ruta | Para qué sirve | Carga además | Estado | Destino | Riesgo |
|------|----------------|--------------|--------|---------|--------|
| `index.html` | Inicio: hero, beneficios, nosotros, catálogo destacado, mapa y pie | `cards-home.css`, `cards-productos.css`, `main.js`; imágenes `Fresa.png`, `fresa sin fondo.png`, `leche.jpg`, `fresitas.png` | Activo | Reemplazar por el nuevo hero | Alto |
| `pages/productos.html` | Catálogo con búsqueda, filtros y ficha de producto | `cards-productos.css`, `main.js` | Activo | Migrar | Alto |
| `pages/carrito.html` | Carrito en página completa | `cart_view.js` | Activo | Migrar (pasa a cajón lateral) | Medio |
| `pages/login.html` | Ingreso con correo o Google | Botón de Google Identity Services | Activo | Migrar a Supabase Auth | Alto |
| `pages/registro.html` | Registro | `cards-productos.css` | Activo | Migrar a Supabase Auth | Alto |
| `pages/perfil.html` | Datos del usuario y cambio de clave | `profile-pro.css` | Activo | Migrar | Medio |
| `pages/recuperar.html` | Pide el código de recuperación | `cards-productos.css` | Activo | Migrar (Supabase envía el correo) | Medio |
| `pages/reset-password.html` | Escribe el código y la clave nueva | `cards-productos.css` | Activo | Migrar | Medio |
| `pages/admin.html` | Panel: productos, usuarios, exportar CSV | `admin-theme.css`, `admin.js` | Activo | Migrar a RLS y Storage | Alto |
| `pages/privacidad.html` | Aviso de datos personales | — | Activo | Mantener contenido | Bajo |
| `404.html` | Página no encontrada | `styles.css`, `shop-ui.css` | Activo | Rediseñar | Bajo |
| `robots.txt` | Bloquea `/pages/admin.html` | — | Activo | Mantener | Bajo |
| `sitemap.xml` | 6 URL con dominio de ejemplo `yoguraso.example` | — | Activo, con dominio falso | Corregir al publicar | Bajo |
| `assets/favicon.svg` | Icono de pestaña | — | Activo (11 páginas) | Reemplazar por el del logo nuevo | Bajo |

CSS.

| Ruta | Tamaño | Para qué sirve | Lo usan | Estado | Destino | Riesgo |
|------|--------|----------------|---------|--------|---------|--------|
| `css/styles.css` | 88 KB | Base: variables, header de escritorio, hero, pie. Importa Google Fonts (Lobster, Plus Jakarta Sans, Outfit) | Todas las páginas | Activo; 4 reglas `@font-face` apuntan a `font/` que no existe | Reemplazar por el sistema de diseño nuevo | Alto |
| `css/shop-ui.css` | 28 KB | Tienda, login, avisos, grilla de productos | Todas las páginas | Activo | Reemplazar | Alto |
| `css/header.css` | 1,5 KB | Menú móvil de tres rayas | Todas | Activo | Reemplazar | Medio |
| `css/cards-home.css` | 2,7 KB | Tarjetas de beneficios | `index.html` | Activo | Reemplazar | Bajo |
| `css/cards-productos.css` | 3,3 KB | Tarjeta de producto | `index`, `productos`, `registro`, `recuperar`, `reset-password` | Activo | Reemplazar | Medio |
| `css/profile-pro.css` | 12 KB | Perfil | `perfil.html` | Activo | Reemplazar | Bajo |
| `css/admin-theme.css` | 15,8 KB | Panel admin | `admin.html` | Activo | Reemplazar | Bajo |

JavaScript.

| Ruta | Para qué sirve | Depende de | Lo usan | Estado | Destino | Riesgo |
|------|----------------|------------|---------|--------|---------|--------|
| `js/config.js` | Objeto global `YOGUR_CONFIG`: WhatsApp, redes, URL de la API, Client ID de Google | — | Todo | Activo | Migrar a variables de entorno y `src/data/site` | Medio |
| `js/utils.js` | `escapeHtml`, `formatCOP`, avisos, diálogos de confirmación, textos del pie | `config.js` | Todo | Activo | Migrar (se vuelve librería) | Medio |
| `js/nav.js` | Abre y cierra el menú móvil | — | Todas las páginas | Activo | Reemplazar (menú accesible con foco atrapado) | Bajo |
| `js/api.js` | Cliente `fetch` hacia Express; 19 funciones exportadas | `config.js` | `auth.js`, `admin.js`, `main.js` | Activo; `checkHealth` y `getProduct` no se usan | Reemplazar por el cliente Supabase | Alto |
| `js/auth.js` | Login, registro, Google, perfil, recuperar y cambiar clave; guarda `token` y `usuario` | `api.js`, `utils.js` | 11 páginas | Activo | Migrar a Supabase Auth | Alto |
| `js/cart.js` | Carrito en `localStorage` (`yogur_cart`), cajón lateral, mensaje y enlace de WhatsApp, historial local de pedidos | `utils.js`, `config.js` | Todas | Activo | Mantener la lógica, migrar a módulo | Alto |
| `js/cart_view.js` | Pinta el carrito en `carrito.html` | `cart.js` | `carrito.html` | Activo | Migrar | Medio |
| `js/main.js` | Catálogo: trae productos, filtra, ordena, pinta tarjetas y ficha. Tiene tamaños 1 L y 2 L con un factor de precio fijo | `api.js` | `index`, `productos` | Activo | Reemplazar por `ProductShowcase` y repositorio de productos | Alto |
| `js/admin.js` | CRUD de productos, subida de imagen, usuarios, exportar CSV | `api.js` | `admin.html` | Activo (36 KB, el archivo más grande) | Migrar a Supabase con RLS | Alto |

Imágenes (`assets/img/`).

| Archivo | Tamaño | Referencias | Estado | Destino |
|---------|--------|-------------|--------|---------|
| `Fresa.png` | 979 KB | `index.html` (`og:image`) | Activo | Reemplazar |
| `fresa sin fondo.png` | 979 KB | `index.html` (imagen del hero) | Activo; **idéntica byte a byte a `Fresa.png`** (mismo MD5) | Reemplazar |
| `leche.jpg` | 2,1 MB | `index.html` (sección nosotros) | Activo | Optimizar o reemplazar |
| `fresitas.png` | 2,3 MB | `index.html` (sección nosotros) | Activo | Optimizar o reemplazar |
| `BG.png`, `Cafe.png`, `Frutos Rojos.png`, `Guanabana.png`, `Mango.png`, `Melocoton.png`, `Mora.png`, `Piña.png`, `Yogurt Griego.png`, `tazon.png` | 1,3 a 3,5 MB c/u | Ninguna en HTML, CSS, JS ni SQL | Sin uso | Eliminadas |

### A.3 Backend (`backend/`)

| Ruta | Para qué sirve | Depende de | Estado | Destino | Riesgo |
|------|----------------|------------|--------|---------|--------|
| `server.js` | Express, Helmet, CORS, límite de intentos, subida de imágenes, health, y 3 grupos de rutas. Al arrancar ejecuta 3 `ALTER TABLE` | `.env`, `pg`, `multer` | Activo | Reemplazar (se conserva hasta la paridad) | Alto |
| `src/config/db.js` | Pool de PostgreSQL | `.env` | Activo | Reemplazar | Medio |
| `src/controllers/authController.js` | 9 funciones: login, registro, perfil, actualizar perfil, recuperar, reset, cambiar clave, código por correo, Google | `bcrypt`, `jsonwebtoken`, `google-auth-library`, `mailService` | Activo | Reemplazar por Supabase Auth | Alto |
| `src/controllers/productController.js` | CRUD de productos con borrado lógico y borrado definitivo | `db.js` | Activo | Reemplazar por PostgREST + RLS | Alto |
| `src/controllers/userController.js` | Listar usuarios y activar o desactivar | `db.js` | Activo | Reemplazar por `profiles` + RLS | Medio |
| `src/middleware/verifyToken.js` | Valida el JWT y el rol de administrador | `jsonwebtoken` | Activo | Reemplazar por RLS | Alto |
| `src/middleware/rateLimit.js` | Límite de intentos en memoria | — | Activo | Reemplazar (lo da Supabase Auth) | Bajo |
| `src/routes/*.js` | Rutas `/api/auth`, `/api/products`, `/api/users` | Controladores | Activo | Reemplazar | Medio |
| `src/services/mailService.js` | Correos con Nodemailer (bienvenida, código, clave cambiada) | SMTP | Activo | Parte con Supabase, parte con Edge Function | Medio |
| `scripts/verify-db.js` | Lista usuarios y cuenta productos | `db.js` | Uso manual | Eliminar cuando salga PostgreSQL local | Bajo |
| `uploads/img_1778207684287_590444.webp` | Una imagen subida por el admin (está en Git aunque `.gitignore` la ignora) | — | Dato | Pasar a Storage o descartar | Bajo |
| `.env.example` | Plantilla de variables | — | Activo | Mantener y ampliar | Bajo |
| `.env` | Variables reales (solo en tu PC, **no** está en Git) | — | Local | No subir | — |
| `package.json` | 10 dependencias | — | Activo | Reducir en la fase 8 | Medio |

### A.4 Base de datos (`database/`)

| Ruta | Para qué sirve | Estado | Destino |
|------|----------------|--------|---------|
| `schema.sql` | Crea 7 tablas, índices, trigger de `updated_at`, 7 productos de ejemplo y un administrador de desarrollo | Activo. Borra todo con `DROP TABLE` al ejecutarse | Traducido en `supabase/migrations/0001_schema.sql` |
| `migration_google_auth.sql` | Agrega `google_id` y `auth_provider` | Ya incluida en `schema.sql` | Absorbida por Supabase Auth |
| `migration_color_fondo_productos.sql` | Agrega `color_fondo` | Ya incluida en `schema.sql` | Traducida |
| `migration_letreros.sql` | Agrega `letrero`, `letrero_tipo`, `descuento` | Ya incluida en `schema.sql` | Traducida |
| `ops_lanzamiento.sql` | Consultas manuales de verificación | Uso manual | Reemplazar por el panel de Supabase |
| `generar_hash_password.js` | Genera un hash bcrypt | Uso manual | Eliminar cuando salga bcrypt |

### A.5 Pruebas, documentación y herramientas

| Ruta | Para qué sirve | Estado | Destino |
|------|----------------|--------|---------|
| `tests/tienda.spec.js` | 3 pruebas: inicio, catálogo, privacidad | Activo | Ampliar |
| `tests/menu-movil.spec.js` | 1 prueba del menú a 390 px | Activo | Mantener |
| `docs/modulos.md` y `docs/modulos.html` | Descripción de módulos; el HTML es la versión para imprimir del mismo texto | Duplicado entre sí | Mantener (documento del taller) |
| `docs/QUE_FALTA_PARA_LANZAR.md`, `docs/GMAIL_Y_GOOGLE.md` | Guías del sistema actual | Activo, quedarán viejas tras Supabase | Reescribir en la fase 8 |
| `docs/guion-capacitacion-web-45-min.md` | Guion de capacitación | Material de formación | Mantener |
| `docs/estdent-factura/` | Factura de otro proyecto (EstDent), no pertenece a YogurASO | Sin relación con la web | Mover fuera del repo cuando decidas |
| `docs/taller-pruebas/` | Tareas del SENA | **Intocable** | Mantener |
| `tools/` | Carpeta vacía | Sin uso | No existe en Git |
| `playwright-report/`, `test-results/` | Salida local de Playwright, ignoradas por Git | Local | Ignorar |

## B. Rutas

El sitio es estático; cada ruta es un archivo HTML. No hay router.

| Ruta pedida | Archivo real hoy | Notas |
|-------------|------------------|-------|
| `/` | `frontend/index.html` | Hero, beneficios, nosotros, productos destacados, mapa |
| `/productos` | `frontend/pages/productos.html` | Catálogo completo |
| `/carrito` | `frontend/pages/carrito.html` | Y también cajón lateral en todas las páginas |
| `/login` | `frontend/pages/login.html` | Correo y Google |
| `/registro` | `frontend/pages/registro.html` | |
| `/perfil` | `frontend/pages/perfil.html` | Exige sesión |
| `/admin` | `frontend/pages/admin.html` | Exige rol `admin` en el navegador; el servidor lo vuelve a validar |
| `/privacidad` | `frontend/pages/privacidad.html` | |
| Adicionales | `recuperar.html`, `reset-password.html`, `404.html` | La recuperación de clave usa código de 6 dígitos, no enlace |

## C. Flujos

Compra:

```text
Inicio -> Productos (GET /api/products) -> Agregar al carrito (localStorage: yogur_cart)
       -> Revisar pedido (ventana de vista previa) -> wa.me con el texto armado
       -> Se guarda yogur_order_history en el navegador (máximo 40)
```

Sesión actual:

```text
Registro o login -> POST /api/auth/registro | /login | /google
                 -> Respuesta con token (JWT 8 h) y usuario
                 -> localStorage: token, usuario
                 -> Cada llamada: Authorization: Bearer <token>
                 -> Si el servidor responde 401/403: se borra la sesión y se redirige al login
```

Administración actual:

```text
Login -> usuario.rol === 'admin' (se lee en el navegador) -> admin.html
      -> api.js manda el token -> verificarToken + verificarAdmin en Express -> PostgreSQL
```

Recuperar clave:

```text
recuperar.html -> POST /api/auth/recuperar -> código de 6 dígitos (se guarda su SHA-256, vence en 15 min)
               -> correo con Nodemailer (si no hay SMTP, sale en la consola del backend)
               -> reset-password.html -> POST /api/auth/reset-password
```

## D. Dependencias

| Tipo | Detalle |
|------|---------|
| Runtime | Node.js, Express 4, `cors`, `helmet`, `dotenv` |
| Autenticación | `jsonwebtoken`, `bcrypt`, `google-auth-library` (verifica el token de Google) |
| Archivos | `multer` (límite de 5 MB; JPG, PNG, WEBP, GIF) |
| Correo | `nodemailer` (Gmail con contraseña de aplicación) |
| Base de datos | `pg` contra PostgreSQL local |
| Desarrollo | `nodemon`, `@playwright/test`, `@types/node` |
| Servicios externos del navegador | Google Fonts, Font Awesome 6.0.0-beta3 (CDN), Google Identity Services, WhatsApp (`wa.me`), imágenes en `i.ibb.co` |
| Almacenamiento del navegador | `localStorage`: `token`, `usuario`, `yogur_cart`, `yogur_order_history`. `sessionStorage`: `yogur_just_logged_in`, `yogur_complete_profile` |

Mapa completo en `DEPENDENCY_MAP.md`.

## E. Deuda técnica

| Nivel | Problema | Dónde |
|-------|----------|-------|
| Crítica | El sitio publicado en GitHub Pages apunta a `localhost:3000`: ni el catálogo ni el login funcionan en producción | `config.js`, `pages.yml` |
| Crítica | Administrador de desarrollo con clave conocida (`password`, documentada en el README) dentro de `schema.sql` | `database/schema.sql`, `README.md` |
| Crítica | Contraseña de la máquina virtual escrita en texto plano en scripts versionados (ya eliminados en esta rama; sigue en el historial de Git) | `scripts/` |
| Alta | JWT guardado en `localStorage`: cualquier fallo XSS lo roba | `auth.js`, `api.js` |
| Alta | El rol de admin se decide en el navegador para mostrar la interfaz (el servidor sí valida, pero con Supabase hay que hacerlo con RLS) | `auth.js`, `admin.js` |
| Alta | Imágenes de producto de 1,3 a 3,5 MB sin optimizar y sin tamaños responsivos | `assets/img/` |
| Alta | `schema.sql` empieza con `DROP TABLE ... CASCADE`: ejecutarlo dos veces borra los datos | `database/schema.sql` |
| Media | `server.js` altera tablas al arrancar (`ALTER TABLE`) en vez de usar migraciones | `server.js` |
| Media | Los precios de 1 L y 2 L salen de un factor (3,2 y 6,4) escrito en el código, no de la base de datos | `main.js` |
| Media | CSS de 150 KB repartido en 7 archivos, con reglas repetidas y 4 `@font-face` rotos | `css/` |
| Media | Sin build, sin tipos, sin lint; `window.*` como estado global | `frontend/js/` |
| Media | CSP desactivada en Helmet | `server.js` |
| Media | Font Awesome en versión beta por CDN | HTML |
| Baja | Rutas duplicadas en inglés (`/profile`, `/change-password`) que el frontend no usa | `authRoutes.js` |
| Baja | Sitemap con dominio falso; sin `canonical` ni datos estructurados | `sitemap.xml` |
| Baja | Texto de marca "YogurASO" en lugar de "YoguraSo" que pide el plan de marca | todo el HTML |

## F. Código muerto

No se borró código dentro de archivos en uso; se lista para quitarlo durante el rediseño.

| Dónde | Qué | Evidencia |
|-------|-----|-----------|
| `frontend/js/api.js` | Funciones `checkHealth` y `getProduct` | 0 usos en `auth.js`, `admin.js`, `main.js` |
| `frontend/css/styles.css` líneas 38 a 41 | 4 `@font-face` hacia `font/*.ttf` | La carpeta `font/` no existe |
| `backend/src/routes/authRoutes.js` | `/profile`, `/change-password` | El frontend usa solo `/perfil` y `/cambiar-password` |
| `backend/server.js` | `GET /api/health` | El frontend no lo llama |
| `backend/src/routes/productRoutes.js` | `GET /api/products/:id` | Solo lo usaba `getProduct`, que nadie llama |
| `database/` | Tablas `carrito`, `carrito_items`, `pedidos`, `detalles_pedido` | Ningún controlador las consulta; el pedido va por WhatsApp |
| `frontend/assets/img/fresa sin fondo.png` | Copia exacta de `Fresa.png` | Mismo MD5 |

Lo que sí se eliminó (con git rm) está en `ELIMINADOS.md`.

## G. Qué se mantiene, qué migra, qué se reemplaza, qué se elimina

- **Se mantiene:** lógica del carrito y del mensaje de WhatsApp, textos de privacidad, `robots.txt`, flujo de publicación en Pages, pruebas de Playwright, documentos del taller.
- **Migra:** autenticación, productos, perfiles, subida de imágenes y panel admin (de Express a Supabase).
- **Se reemplaza:** todo el CSS, el hero, las tarjetas, el menú, el catálogo y `config.js`.
- **Se elimina:** carpeta `backup/`, scripts y `.bat` de la máquina virtual Ubuntu, 10 imágenes sin referencias. Más adelante: Express, JWT propio, bcrypt, Multer, Nodemailer y `pg`.
