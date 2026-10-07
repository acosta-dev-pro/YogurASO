# YoguraSo

Yogurt artesanal del Huila, en presentación de 500 ml. La web muestra la marca, el catálogo y el carrito. El pedido sale por WhatsApp. No hay pasarela de pagos.

Es una página estática: HTML, CSS y JavaScript, sin framework y sin servidor propio. Los datos viven en Supabase. El mismo sitio corre en el computador y en GitHub Pages.

## Características

- Portada con sabores, historia, proceso, empaque y yogures destacados.
- Catálogo con búsqueda, ficha del producto y tarjetas por sabor.
- Carrito en el navegador y resumen listo para enviar por WhatsApp.
- Cuentas: registro, ingreso, recuperación de clave y Google.
- Perfil del cliente y panel de administrador (productos y usuarios).
- Se adapta al celular y a la computadora.
- Preguntas, contacto, distribuidores, política de datos y aviso de cookies.
- Panel con inventario y alertas de stock, usuarios, preguntas de clientes, anuncios y estudio de color.

## Stack

| Capa | Tecnología | Dónde está |
|---|---|---|
| Estructura | HTML | `frontend/index.html` y `frontend/pages/` |
| Presentación | CSS | `frontend/css/` |
| Comportamiento | JavaScript, sin framework | `frontend/js/` |
| Datos | Supabase: Postgres, Auth, Storage y reglas RLS | `supabase/migrations/` y `frontend/js/api/` |
| Pedido | WhatsApp. No hay caja de pagos | `frontend/js/cart.js` |
| Publicación | GitHub Pages, carpeta `frontend/` | `.github/workflows/pages.yml` |
| Pruebas | Playwright | `tests/` |
| Arranque local | `npm start` o `INICIAR-YOGURASO.bat`, puerto 5500 | `tools/serve-frontend.js` |

En el navegador solo va la clave pública, en `frontend/js/supabase-client.js`. La clave secreta no entra al proyecto. Quién puede leer o escribir lo deciden las reglas de la base (RLS).

## Lógica

1. La persona abre la portada o el catálogo. El catálogo se pide a Supabase. Si falla la red, se muestran los sabores guardados en el sitio (`js/catalogo.js`).
2. Al agregar un yogurt, la bolsa se guarda en este navegador (`localStorage`, clave `yogur_cart`).
3. Al comprar, el texto del pedido se abre en WhatsApp. Si se puede, antes queda una copia en la base con la función `create_order`.
4. La sesión la guarda Supabase. El navegador solo guarda un espejo para pintar el menú.
5. Registrarse pide correo y una clave de al menos 8 caracteres. Supabase manda un código de 6 dígitos para activar la cuenta. Recuperar o cambiar la clave usa el mismo tipo de código.
6. Un visitante lee los productos activos. Solo una cuenta con rol `admin` en `profiles` puede crear, editar o borrar. Ocultar un botón no es la seguridad: la base también lo impide.

En la base las columnas van en inglés (`name`, `price`, `is_active`). En la pantalla se leen en español. Esa traducción está en `frontend/js/api/mapeo.js`.

## Mapa

```
frontend/                       lo que publica GitHub Pages
  index.html                    portada
  404.html                      página de error
  pages/                        catálogo, carrito, login, registro, recuperar, perfil, admin, privacidad
  css/                          un archivo por sección (header, hero, productos, admin-*, faq…)
  fonts/                        tipografías alojadas en el proyecto (no se llama a Google Fonts)
  assets/                       imágenes, íconos, video y logos
  robots.txt, sitemap.xml       buscadores (el dominio real se añade al publicar)
  js/
    config.js                   WhatsApp, redes y datos de la marca
    supabase-client.js          URL y clave pública de Supabase
    api.js                      reparte la capa de datos
    api/                        cliente, mapeo, sesion, productos, cuentas, usuarios, pedidos, ajustes
    admin.js                    arranque del panel
    admin/                      un módulo por pestaña: inventario, stock, usuarios, preguntas, anuncios,
                                estudio de color, formulario de producto…
    cart.js, cart-fx.js         bolsa, mensaje de WhatsApp y efectos
    catalogo.js                 precios, fotos y carga de productos
    tarjeta-yogur.js, main.js   tarjeta de yogur y catálogo (carrusel: home-products-carousel.js)
    hero.js, recorrido.js       portada con carrusel de botellas y recorrido al hacer scroll
    auth*.js                    formularios y menú de cuenta
    notice.js                   aviso de cookies y de privacidad
    faq.js, ysf-*.js            preguntas frecuentes, contacto y pie de página
    components/                 piezas reutilizables
supabase/
  migrations/                   0001 a 0006: tablas, seguridad por fila (RLS), funciones y permisos
  functions/account-admin/      Edge Function: eliminar cuenta propia y bloquear cuentas
  seed.sql                      los 10 sabores del catálogo
tools/                          servidor local, versión de caché, SEO y capturas
tests/                          pruebas de la tienda con Playwright
.github/workflows/              publicación en GitHub Pages
brand/, public/, assets-source/ logos, fotos de producto y originales
```

## Publicación, seguridad y privacidad

- **Publicación:** cada cambio en `main` lo publica GitHub Actions (`.github/workflows/pages.yml`). Antes de subir, `tools/stamp-version.js` añade una versión a los archivos para que los celulares no usen copias viejas, y `tools/stamp-seo.js` pone el dominio real en sitemap, canonical y Open Graph.
- **Base de datos:** para armarla desde cero, ejecuta en el SQL Editor de Supabase las migraciones `0001` a `0006` en orden y luego `supabase/seed.sql`.
- **Seguridad:** las contraseñas las guarda Supabase cifradas. Cada tabla tiene reglas RLS y las funciones internas no son públicas (migración 0006).
- **Privacidad:** `frontend/pages/privacidad.html` explica qué datos se guardan (Ley 1581 de 2012) y `js/notice.js` pide la elección sobre cookies.

## Arranque

```bash
npm start
```

Abre `http://127.0.0.1:5500`. También sirve el doble clic en `INICIAR-YOGURASO.bat`.

Para dejar una cuenta como administradora, la persona se registra y luego, en Supabase → SQL Editor:

```sql
update public.profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'correo@ejemplo.com');
```

## Pruebas

```bash
npm install
npx playwright install chromium
npm test
```
