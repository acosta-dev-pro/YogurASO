# Páginas internas: capa visual de marca

Esto cubre todo lo que no es la portada: catálogo, carrito, login, registro, recuperar, reset, perfil, admin, privacidad y 404.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `frontend/css/brand-pages.css` | Ajustes visuales del contenido de cada página: cards, formularios, botones, carrito, admin, perfil, pie de página, privacidad y 404. |
| `frontend/js/pages-motion.js` | Entradas escalonadas (fade + subida de 14 px, 90 ms entre bloques, 0,4 s) para bloques de contenido. |

Las dos se enlazan justo antes de `</head>` en cada página, así cargan después de `brand.css`, `header.css` y `motion.css`.

## Reparto con la base de marca

- `brand.css` pone los tokens (colores, fuentes, radios). `brand-pages.css` los lee y no los redefine.
- `header.css` es dueño del menú y del logo. `brand-pages.css` no toca el `header`.
- `motion.css` + `main.js` animan la entrada de las cards del catálogo y `ui-motion.js` el contador del carrito. `pages-motion.js` no anima cards, solo bloques (tarjeta de login, resumen del carrito, secciones del admin, perfil, pie de página).
- Fondo: crema plano, como define `brand.css`.

## Reglas que sigue

- Fredoka en títulos, precios y botones; Nunito Sans en el resto.
- Rojo #E51D2A, verde #4FAE45 (oscurecido a #2F8F2B en botones de WhatsApp para que el texto blanco se lea), crema #FFF7E8, tinta #171717.
- Esquinas de 16 a 24 px; espaciado en múltiplos de 8.
- Botones que suben 4 px al pasar el mouse; cards con borde de 1 px que se ilumina en rojo.
- Solo se animan `transform` y `opacity`, con `cubic-bezier(0.22, 1, 0.36, 1)`.
- Catálogo: 4 columnas en escritorio, 2 en tablet, 1 en celular.
- Con `prefers-reduced-motion` no hay entradas ni desplazamientos.
- Sin JavaScript todo se ve normal (las entradas solo existen si el script marca `<html class="bp-pages">`).

## Si se regenera el `<head>` de una página

Hay que conservar estas dos líneas al final del `<head>`:

```html
<link rel="stylesheet" href="../css/brand-pages.css">
<script src="../js/pages-motion.js"></script>
```

En `404.html` van sin `../`.
