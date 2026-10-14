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
- Preguntas, contacto, distribuidores y aviso de privacidad.

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
frontend/                  lo que publica GitHub Pages
  index.html               portada
  pages/                   catálogo, carrito, login, registro, perfil, admin, privacidad
  css/                     estilos por sección
  js/
    config.js              WhatsApp, redes y datos de la marca
    supabase-client.js     URL y clave pública
    api.js                 reparte la capa de datos
    api/cliente.js         conexión y errores en español
    api/mapeo.js           columnas de la base ↔ textos de la pantalla
    api/sesion.js          sesión
    api/productos.js       catálogo y fotos
    api/cuentas.js         registro, ingreso y contraseñas
    api/usuarios.js        cuentas del panel
    api/pedidos.js         guardar el pedido antes de WhatsApp
    cart.js                bolsa y mensaje de WhatsApp
    catalogo.js            grilla de productos
    hero.js                portada y cambio de sabor
    auth.js                formularios de cuenta
    admin.js               panel
supabase/migrations/       tablas, RLS y fotos
tools/serve-frontend.js    servidor local
tests/                     pruebas de la tienda
```

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
