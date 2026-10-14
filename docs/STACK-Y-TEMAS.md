# Stack y temas de programación

Texto para copiar en el documento o en la exposición. Habla de la web **como está ahora**.

## Stack

| Capa | Tecnología | Dónde se ve |
|---|---|---|
| Estructura | HTML | `frontend/index.html` y `frontend/pages/` |
| Presentación | CSS | `frontend/css/` |
| Comportamiento | JavaScript, sin framework | `frontend/js/` |
| Datos | Supabase: Postgres, Auth, Storage y reglas RLS | `supabase/migrations/` y `frontend/js/api/` |
| Pedido | WhatsApp (`wa.me`). No hay pasarela de pagos | `frontend/js/cart.js` |
| Publicación | GitHub Pages, carpeta `frontend/` | `.github/workflows/pages.yml` |
| Pruebas | Playwright | `tests/` |
| Arranque local | `npm start` o `INICIAR-YOGURASO.bat` en el puerto 5500 | `tools/serve-frontend.js` |

La clave que va en el navegador es la pública (`frontend/js/supabase-client.js`). La clave secreta no entra al proyecto.

## Por qué los nombres del código van en inglés

En la base las columnas se llaman `name`, `price`, `is_active`. En la pantalla se ven en español: nombre, precio, activo. Esa traducción está en `frontend/js/api/mapeo.js`. Por eso una variable del código puede decir `price` y el cliente lee «precio».

| En el código o en la base | En la pantalla |
|---|---|
| `name` | nombre |
| `price` | precio |
| `stock` | existencias |
| `flavor` / `slug` | sabor |
| `description` | descripción |
| `is_active` | activo |
| `cart` | bolsa / carrito |
| `session` | sesión |
| `profile` | perfil |

## Temas de programación que usa el proyecto

1. **HTML semántico.** Cada pantalla es un archivo. El inicio marca cada bloque con un comentario «Aquí queda».
2. **CSS.** Colores, tipografía y el movimiento visual (por ejemplo `css/motion.css` y `css/hero.css`).
3. **Variables y funciones.** La configuración de la marca está en `js/config.js`. Cada archivo hace una sola cosa.
4. **Módulos.** `api.js` reparte el trabajo: conexión, mapeo, sesión, productos, cuentas, usuarios y pedidos.
5. **DOM y eventos.** Clic en agregar, menú del celular, acordeón de preguntas, ficha del producto.
6. **Almacenamiento del navegador.** La bolsa vive en `localStorage` (`yogur_cart`). La sesión real la guarda Supabase; el navegador solo guarda un espejo para pintar el menú.
7. **Asincronía.** El catálogo se pide a Supabase y, si falla la red, se muestran los sabores locales (`js/catalogo.js`).
8. **Validación.** El contacto exige nombre y mensaje. El registro exige correo y una clave de al menos 8 caracteres. La base también valida con reglas.
9. **Seguridad.** RLS: un visitante lee productos activos; solo un admin escribe. Ocultar un botón no es la seguridad.
10. **Animación.** Separada de la lógica de compra. Portada en `hero.js`, fila de yogures en `home-products-carousel.js`, aparición al bajar en `scroll-reveal.js`, efectos de la bolsa en `cart-fx.js`. Si la persona pidió menos movimiento, no animan.
11. **Integración.** El pedido se arma en texto y se abre WhatsApp. Antes, si se puede, queda guardado con la función `create_order`.
12. **Control de versiones.** Git, en la rama `redesign/yoguraso-v2`.
13. **Pruebas.** Playwright abre la página y comprueba marca, sabores, catálogo y privacidad.

## Cómo contarlo en una frase

La persona ve HTML y CSS, JavaScript arma la bolsa y pide los datos a Supabase, y el pedido sale por WhatsApp.
