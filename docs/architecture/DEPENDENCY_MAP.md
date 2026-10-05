# Mapa de dependencias

Lo que se conecta con qué hoy. Sirve para saber qué se rompe si se toca un archivo.

## 1. Frontend: quién carga a quién

Orden de carga de scripts en la mayoría de páginas:

```text
config.js  ->  utils.js  ->  nav.js  ->  cart.js  ->  auth.js (módulo)  ->  [main.js | admin.js | cart_view.js]
```

| Página | Scripts específicos | CSS específico |
|--------|--------------------|----------------|
| `index.html` | `main.js` | `cards-home.css`, `cards-productos.css` |
| `pages/productos.html` | `main.js` | `cards-productos.css` |
| `pages/carrito.html` | `cart_view.js` | — |
| `pages/login.html`, `privacidad.html` | — | — |
| `pages/registro.html`, `recuperar.html`, `reset-password.html` | — | `cards-productos.css` |
| `pages/perfil.html` | — | `profile-pro.css` |
| `pages/admin.html` | `admin.js` | `admin-theme.css` |
| `404.html` | ninguno | solo `styles.css` y `shop-ui.css` |

Cadena entre módulos:

```text
config.js (window.YOGUR_CONFIG)
   ├── utils.js (window.YogurUtils)  ──┬── cart.js (window.Cart)
   │                                   ├── auth.js ─┐
   └── api.js (módulo ES) <────────────┴── admin.js ├── main.js
                                                    └── (api.js)
```

- `api.js` lo importan `auth.js`, `admin.js` y `main.js`. Es el único punto que habla con Express.
- `cart.js` no importa nada; lee `window.YogurUtils` y `window.YOGUR_CONFIG`.
- `cart_view.js` depende de `window.Cart`.
- `nav.js` y `config.js` no dependen de nadie.

Lo que habla con el backend, por archivo:

| Archivo | Endpoints que usa |
|---------|-------------------|
| `auth.js` | `/auth/login`, `/auth/registro`, `/auth/google`, `/auth/perfil` (GET y PUT), `/auth/recuperar`, `/auth/reset-password`, `/auth/cambiar-password`, `/auth/perfil/codigo-password` |
| `admin.js` | `/products` (GET con `includeInactive`, POST, PUT, DELETE), `/products/:id/permanent`, `/upload`, `/users`, `/users/:id/activo` |
| `main.js` | `/products` (GET) |

## 2. CSS

```text
styles.css  ──@import── Google Fonts
   ▲ la cargan todas las páginas
header.css  (menú móvil)         shop-ui.css (tienda, avisos)
cards-home.css  cards-productos.css  profile-pro.css  admin-theme.css   (cada una en su página)
```

`cards-productos.css` y `shop-ui.css` se referencian entre sí por comentarios y por `main.js` (clases generadas en JavaScript). Antes de borrar clases hay que buscarlas también dentro de `main.js`, `cart.js`, `auth.js` y `admin.js`, que arman HTML con plantillas de texto.

## 3. Backend

```text
server.js
 ├── dotenv ─ backend/.env
 ├── helmet, cors, express.json
 ├── multer ─ backend/uploads/  (servida en /uploads)
 ├── src/config/db.js ─ pg ─ PostgreSQL
 ├── src/middleware/rateLimit.js
 ├── src/middleware/verifyToken.js ─ jsonwebtoken
 ├── src/routes/authRoutes.js    ─ authController.js ─ bcrypt, jsonwebtoken, google-auth-library, mailService.js ─ nodemailer
 ├── src/routes/productRoutes.js ─ productController.js
 └── src/routes/userRoutes.js    ─ userController.js
```

## 4. Dependencias npm

| Paquete | Dónde | Para qué | Destino con Supabase |
|---------|-------|----------|----------------------|
| `express` | backend | Servidor HTTP | Se puede quitar |
| `cors`, `helmet` | backend | Seguridad HTTP | Se pueden quitar |
| `dotenv` | backend | Variables | Se puede quitar |
| `pg` | backend | PostgreSQL | Se puede quitar |
| `jsonwebtoken` | backend | Sesión propia | Se puede quitar |
| `bcrypt` | backend | Claves | Se puede quitar |
| `google-auth-library` | backend | Verificar token de Google | Se puede quitar (Google entra por Supabase Auth) |
| `multer` | backend | Subir imágenes | Se puede quitar (Storage) |
| `nodemailer` | backend | Correos | Se puede quitar si se usa el correo de Supabase Auth; queda en una Edge Function solo si se quiere el correo de bienvenida |
| `nodemon` | backend dev | Recarga | Se puede quitar |
| `@playwright/test` | raíz dev | Pruebas | Se mantiene |
| `@types/node` | raíz dev | Tipos | Se mantiene si hay TypeScript |

## 5. Servicios externos

| Servicio | Quién lo usa | Notas |
|----------|--------------|-------|
| WhatsApp (`wa.me`) | `cart.js`, `utils.js` | Número de prueba `573001234567` en `config.js` |
| Google Identity Services | `auth.js` | El Client ID del frontend es público; el proyecto de Google Cloud se reutiliza en Supabase |
| Gmail SMTP | `mailService.js` | Credenciales en `backend/.env` |
| Google Fonts | `styles.css` | Cambiará a Fredoka y Nunito Sans |
| Font Awesome (cdnjs) | Todas las páginas | Se puede reemplazar por SVG propios |
| `i.ibb.co` | Productos sembrados en `schema.sql` | Imágenes alojadas fuera del proyecto; se pasan a Storage o a `public/products/` |
| GitHub Pages | `pages.yml` | Solo publica `frontend/` |

## 6. Datos entre capas

```text
tabla productos ──(mapProduct)──> JSON { id, nombre, descripcion, precio, stock, imagen_url,
                                          categoria, letrero, letrero_tipo, descuento, color_fondo, activo }
               ──> main.js pinta .producto-card ──> cart.js guarda { id, nombre, precio, cantidad, imagen, stock, tamano }
               ──> wa.me/<numero>?text=<pedido>
```

Los nombres de campo (`nombre`, `precio`, `imagen_url`, `color_fondo`...) están repetidos en `productController.js`, `api.js`, `main.js`, `admin.js` y `cart.js`. Al migrar, hay que cambiarlos todos a la vez o mantener una capa de traducción.
