# Módulos del sistema YoguraSo

Documento para la exposición. La web es HTML, CSS y JavaScript, y los datos viven en Supabase.

El stack y los temas de programación, listos para copiar, están en `docs/STACK-Y-TEMAS.md`.

Para abrirla en el computador: `npm start` y entrar a `http://127.0.0.1:5500`.

## Cómo viaja un pedido

1. La persona entra al inicio (`frontend/index.html`). El carrusel de sabores está en `js/home-products-carousel.js`.
2. Los productos salen de Supabase. Si la red falla, se muestran los sabores locales (`js/catalogo.js`).
3. Agregar al carrito guarda la bolsa en el navegador (`js/cart.js`, clave `yogur_cart`).
4. Comprar intenta guardar el pedido en Supabase (`js/api/pedidos.js`, función `create_order`) y abre WhatsApp con el texto del pedido.
5. No hay pasarela de pagos.

## 1. Páginas

Cada pantalla es un HTML. No hay router.

| Pantalla | Archivo |
|---|---|
| Inicio | `frontend/index.html` |
| Catálogo | `frontend/pages/productos.html` |
| Carrito | `frontend/pages/carrito.html` |
| Ingreso | `frontend/pages/login.html` |
| Registro | `frontend/pages/registro.html` |
| Recuperar clave | `frontend/pages/recuperar.html` y `reset-password.html` |
| Perfil | `frontend/pages/perfil.html` |
| Panel | `frontend/pages/admin.html` |
| Datos personales | `frontend/pages/privacidad.html` |

El menú marca **Sabores** hacia la sección `#productos` del inicio y **Catálogo** hacia la página de productos.

## 2. JavaScript, un archivo por responsabilidad

| Archivo | Qué hace |
|---|---|
| `js/config.js` | WhatsApp, redes y nombre de la marca |
| `js/utils.js` | Texto seguro, precios en pesos, avisos |
| `js/nav.js` | Menú móvil |
| `js/cart.js` | Bolsa, ticket y compra por WhatsApp |
| `js/cart_view.js` | La misma bolsa en la página del carrito |
| `js/auth.js` | Formularios: ingreso, registro, recuperar y perfil |
| `js/auth-comun.js` | Rutas de las páginas y la sesión que se pinta en pantalla |
| `js/auth-menu.js` | Botón de cuenta y enlaces del menú según haya sesión |
| `js/main.js` | Tarjetas del catálogo, búsqueda y filtros |
| `js/catalogo.js` | Precio con descuento, botella del sabor y respaldo local |
| `js/hero.js` | Carrusel grande de la portada |
| `js/home-products-carousel.js` | Carrusel Nuestros yogures |
| `js/scroll-reveal.js` | Aparición al bajar |
| `js/admin.js` | Panel: productos y usuarios |
| `js/supabase-client.js` | URL y clave **pública** de Supabase |

La clave secreta (`service_role`) no va en estos archivos. Quien puede leer o escribir lo decide la base (RLS).

## 3. Capa de datos (`js/api.js`)

`api.js` no tiene la lógica: solo reexporta, para que el resto de la web siga importando `./api.js`.

| Módulo | Qué hace |
|---|---|
| `js/api/cliente.js` | Pide el cliente de Supabase y traduce los errores al español |
| `js/api/mapeo.js` | Pasa columnas en inglés (`name`, `price`) a campos en español (`nombre`, `precio`) |
| `js/api/sesion.js` | Sesión real y un espejo en `localStorage` para pintar el menú sin esperar la red |
| `js/api/productos.js` | Listar, crear, editar y subir la foto del yogur |
| `js/api/cuentas.js` | Registro, ingreso, Google y cambio de contraseña |
| `js/api/usuarios.js` | Activar o desactivar cuentas desde el panel |
| `js/api/pedidos.js` | Guarda el pedido antes de abrir WhatsApp |

## 4. Base de datos

Las tablas y las reglas viven en `supabase/migrations/`.

## 5. El inicio, de arriba a abajo

En `frontend/index.html` cada bloque tiene un comentario que empieza con "Aquí queda".

| Lo que se ve | Dónde está |
|---|---|
| Barra de arriba | el `header`. El menú del celular es `js/nav.js` |
| Carrusel grande de botellas | sección `#hero`, movimiento en `js/hero.js` |
| Nosotros | sección `#nosotros`. Me gusta en `js/interactions.js`. Comentarios en `js/post-comments.js` |
| Proceso | sección `#proceso`, entrada en `js/proceso-3d.js` |
| Collage de fruta | sección `#fruta-real`, entrada en `js/collage-fruta.js` |
| Tres momentos | sección `.ytrio`. El del centro sigue el sabor: `js/trio-sabor.js` |
| Empaque | sección `#empaque`, datos en `js/product-info.js` |
| Carrusel Nuestros yogures | sección `#productos`, movimiento en `js/home-products-carousel.js` |
| Distribuidores | sección `#distribuidores` |
| Preguntas | sección `#preguntas`, acordeón en `js/faq.js` |
| Contacto | sección `#contacto`, formulario en `js/ysf-contacto.js` |
| Pie | `js/ysf-footer.js` |
| Bolsa lateral | `js/cart.js`. Los efectos (botella que vuela, número que late) están en `js/cart-fx.js` |

## 6. Animaciones, aparte de la lógica

Si alguien pide menos movimiento, estas piezas no animan.

| Archivo | Qué mueve |
|---|---|
| `js/hero.js` | Botellas y fondo de la portada |
| `js/home-products-carousel.js` | Fila de yogures del inicio |
| `js/scroll-reveal.js` | Aparición al bajar en el inicio |
| `js/ui-motion.js` | El número del carrito contando |
| `js/cart-fx.js` | Botella que viaja al ícono y aviso de quitar |
| `js/pages-motion.js` | Entrada de las páginas internas |
| `js/proceso-3d.js`, `js/collage-fruta.js`, `js/trio-sabor.js` | Esas tres secciones del inicio |

`js/yogurt-drip.js` y `js/depth.js` están vacíos a propósito: esos efectos se apagaron.

