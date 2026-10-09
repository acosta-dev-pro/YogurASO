# YogurASO

Sitio de yogurt artesanal (Huila). Catálogo, carrito en el navegador, cuentas y panel admin. El pedido se manda por WhatsApp; no hay caja de pagos.

Es una web **estática** (HTML, CSS y JavaScript sin framework) que habla directo con **Supabase**. No hay servidor propio: funciona igual en local y en GitHub Pages.

---

## Qué hay adentro

| Capa | Tecnología |
|------|------------|
| Front | HTML, CSS, JavaScript (módulos ES, sin build) |
| Datos | Supabase (PostgreSQL con reglas RLS) |
| Cuentas | Supabase Auth: correo + contraseña con código de 6 dígitos, y Google |
| Imágenes | Supabase Storage, bucket `product-images` |

---

## Mapa del repo

```
YOGURASO-WEB/
├── frontend/                   la web (esto es lo que publica GitHub Pages)
│   ├── index.html
│   ├── pages/                  productos, carrito, login, registro, perfil, admin, privacidad
│   ├── css/
│   └── js/
│       ├── config.js           WhatsApp, redes, Google Client ID
│       ├── supabase-client.js  URL y clave PÚBLICA de Supabase
│       ├── api.js              catálogo, cuentas, perfil y admin contra Supabase
│       ├── auth.js             sesión y formularios
│       ├── cart.js             carrito y mensaje de WhatsApp
│       ├── main.js             arma el HTML de cada producto
│       └── admin.js            panel (productos y usuarios)
├── supabase/
│   ├── migrations/             tablas, RLS, is_admin(), bucket de fotos
│   └── seed.sql
├── tools/serve-frontend.js     servidor estático local (puerto 5500)
└── tests/                      Playwright
```

---

## Arranque en local

```bash
npm start            # = node tools/serve-frontend.js  →  http://127.0.0.1:5500
```

O doble clic en `INICIAR-YOGURASO.bat`, o Live Server / `npx serve frontend`. No hace falta nada más: los datos vienen de Supabase.

---

## Dónde se configura

- **`frontend/js/supabase-client.js`**: Project URL y **Publishable key** (`sb_publishable_...`). Es pública; la protegen las reglas RLS. **Nunca** pongas aquí la Secret key ni la `service_role`.
- **`frontend/js/config.js`**: WhatsApp, redes, `SITE_URL`, `GOOGLE_CLIENT_ID`.
- **Panel de Supabase**: Google (Client ID y secreto), SMTP de Gmail, plantillas de correo con `{{ .Token }}`, Site URL y Redirect URLs.

### Volver admin a una cuenta

La persona se registra en la web y luego, en Supabase → SQL Editor:

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'correo@ejemplo.com');
```

---

## Cuentas

- Registro: Supabase manda un **código de 6 dígitos** al correo y la web lo pide para activar la cuenta.
- Recuperar clave: código de 6 dígitos en `pages/recuperar.html`.
- Cambiar clave desde el perfil: código de reautenticación al correo.
- Google: botón oficial de Google → `signInWithIdToken` de Supabase.
- La clave pide **8 caracteres**.

---

## Cómo se compra hoy

1. El usuario arma el carrito (`localStorage`).
2. Pulsa comprar y se abre WhatsApp con el resumen.
3. Ustedes cierran la venta en el chat.

---

## Tests

```bash
npm install
npx playwright install chromium
npm test
```

Playwright sirve `frontend/` en el puerto 4173.

---

## Subir a internet

GitHub Pages publica `frontend/` tal cual. Antes de abrir al público:

1. WhatsApp real en `config.js`.
2. En Google Auth Platform, publicar la app (si está en **Prueba**, solo entran los usuarios de prueba con Google).
3. En `frontend/sitemap.xml` cambia `yoguraso.example`.

Más detalle: `docs/migration/NODE_TO_SUPABASE.md` y `docs/GMAIL_Y_GOOGLE.md`.
