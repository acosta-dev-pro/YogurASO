# YogurASO

Sitio de yogurt artesanal (Huila). Catálogo, carrito en el navegador, cuentas con JWT y panel admin. El pedido se manda por WhatsApp; no hay caja de pagos ni pedidos guardados en la API.

---

## Qué hay adentro

| Capa | Tecnología |
|------|------------|
| Front | HTML, CSS, JavaScript (sin framework) |
| API | Node.js + Express |
| Base de datos | PostgreSQL |
| Auth | JWT, bcrypt, Google opcional |
| Imágenes | Multer → `backend/uploads` |

---

## Mapa del repo

```
YOGURASO-WEB/
├── frontend/
│   ├── index.html
│   ├── pages/                  productos, carrito, login, registro, perfil, admin, privacidad
│   ├── css/
│   │   ├── styles.css          layout, header desktop, footer, hero
│   │   ├── header.css          menú de tres rayas (celular)
│   │   ├── cards-home.css      cards de beneficios / pasteles
│   │   ├── cards-productos.css card del catálogo
│   │   ├── shop-ui.css         tienda, login, toasts
│   │   └── admin-theme.css     panel
│   ├── js/
│   │   ├── config.js           WhatsApp, URL del API, redes
│   │   ├── nav.js              abre/cierra el menú
│   │   ├── api.js              llamadas HTTP
│   │   ├── auth.js             sesión y formularios
│   │   ├── cart.js             carrito y mensaje de WhatsApp
│   │   ├── main.js             arma el HTML de cada producto
│   │   └── admin.js            CRUD
│   └── assets/
├── backend/
│   ├── server.js
│   ├── .env.example
│   └── src/
├── database/                   schema.sql y scripts
└── tests/                      Playwright
```

---

## Arranque en local

### 1. Base de datos

```bash
psql -U postgres -c "CREATE DATABASE yoguraso_db;"
psql -U postgres -d yoguraso_db -f database/schema.sql
```

### 2. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

API: `http://localhost:3000` — health: `http://localhost:3000/api/health`

### 3. Frontend

Abre `frontend/` con Live Server (o `npx serve frontend`).

En `frontend/js/config.js`, `API_URL` debe coincidir con ese puerto.

---

## Dónde se configura

**`frontend/js/config.js`** — WhatsApp, API, `SITE_URL`, Google, redes.

**`backend/.env`** — Postgres, `JWT_SECRET`, `CORS_ORIGINS`, `FRONTEND_URL`, SMTP, `GOOGLE_CLIENT_ID`.

Admin de ejemplo (cámbialo antes de publicar):

- correo: `admin@yoguraso.com`
- clave: `password`

```bash
node database/generar_hash_password.js "TuClaveNueva"
```

---

## Cómo se compra hoy

1. El usuario arma el carrito (`localStorage`).
2. Pulsa comprar y se abre WhatsApp con el resumen.
3. Ustedes cierran la venta en el chat.

No hay pedidos en PostgreSQL conectados a esta app.

---

## Cuentas

Login, registro, Google, recuperar clave, perfil. La clave pide **8 caracteres**.

Si no hay SMTP, el link de recuperación sale en la consola del backend.

---

## CSS: qué archivo tocar

- Home / header desktop / footer → `css/styles.css`
- Menú celular → `css/header.css` + `js/nav.js`
- Cards “por qué nosotros” y cobertura → `css/cards-home.css`
- Card de yogurt → `css/cards-productos.css` (el HTML sale de `js/main.js`)
- Login, toasts, catálogo extra → `css/shop-ui.css`
- Admin → `css/admin-theme.css`

---

## Tests

```bash
npm install
npx playwright install chromium
npm test
```

Playwright sirve `frontend/` en el puerto 4173. Cubre inicio, catálogo y menú en 390px.

---

## Subir a internet

1. Postgres en el hosting.
2. `JWT_SECRET` nuevo y admin con clave fuerte.
3. HTTPS en el sitio y en la API.
4. `config.js` y `.env` con dominio real y WhatsApp real.
5. En `frontend/sitemap.xml` cambia `yoguraso.example`.
6. SMTP para los correos de clave.
7. `NODE_ENV=production` (así CORS no abre cualquier localhost).

Notas extra: `docs/QUE_FALTA_PARA_LANZAR.md`.

No subas `backend/.env` al git.
