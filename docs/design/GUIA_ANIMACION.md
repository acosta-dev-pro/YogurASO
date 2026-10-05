# Guía de animación

Parámetros reales usados en el hero y en el resto de la web. Todo está en HTML, CSS y JS puros (sin React todavía). Archivos: `frontend/css/hero.css`, `header.css`, `motion.css`, `brand.css` y `frontend/js/hero.js`, `ui-motion.js`, `sound.js`, `flavors.js`.

## Reglas generales

- Se anima solo `transform` y `opacity`. La excepción es el color de fondo del hero, que se interpola con `background-color` (un solo rectángulo, sin blur).
- Easing de entrada y movimiento: `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-out`). Para colores: `cubic-bezier(0.4, 0, 0.2, 1)` (`--ease-soft`).
- Duraciones: hover 200–300 ms, entradas 300–500 ms, cambios grandes 400–600 ms. Nada pasa de 0,64 s.
- Entradas: fade más subida vertical de 14–16 px. Sin movimiento horizontal en rejillas de tarjetas.
- Escalonado entre elementos: 80–120 ms (90 ms por defecto).
- `prefers-reduced-motion: reduce`: sin desplazamientos, sin flotación, sin malla animada, sin inclinación; el cambio de sabor es un cruce de 120–160 ms y el color cambia casi al instante.

## Hero

| Qué | Parámetro |
|---|---|
| Entrada de la portada (una sola vez) | título 0 ms, subtítulo 100 ms, botón 200 ms, selector 300 ms; 500 ms; fade + subida 16 px |
| Entrada de las botellas | principal 100 ms, la de atrás 250 ms; 600 ms; subida 18 px + escala 0,95 → 1 |
| Cambio de sabor, textos | título, subtítulo y botón con 90 ms entre cada uno; 420 ms; subida 16 px (el título arranca en opacidad 0,35 para no parpadear) |
| Cambio de sabor, botella | sale en 220 ms (baja 10 px, escala 0,97, opacidad 0); entra en 640 ms con su propio gesto (tabla de abajo); la de atrás entra 130 ms después con 60 % del gesto |
| Fondo | `background-color` 600 ms, `--ease-soft`; también cambian mesa, acentos del botón y píldora activa con la misma duración |
| Malla de degradados | 4 manchas con máscara radial (sin `filter: blur`, para que el cambio de color sea barato), opacidad 0,5 (la de la mesa 0,38), 24–32 s por ciclo, `alternate`, solo `transform` (movimiento de 4–7 unidades y escala 0,92–1,18) |
| Flotación | botella principal: −1,2 % de alto y 0,35° en 7 s; la de atrás en 8,5 s con desfase de −3 s; la sombra respira (escala 0,94, opacidad 0,82) al mismo ritmo |
| Inclinación con cursor | solo ratón en pantallas de más de 860 px: ±4,5° en Y y ±2,5° en X, suavizado 8 % por cuadro; se apaga en táctil y con movimiento reducido |
| Botón "Conoce nuestros Sabores" | hover: sube 4 px y escala 1,01 en 250 ms; la flecha se desplaza 3 px |
| Selector de sabores | la píldora activa se ensancha en 400 ms (`grid-template-columns`), el nombre aparece con 100 ms de retraso; el punto sube 2 px al pasar el cursor |
| Botella de atrás | hover: sube 8 px en 300 ms; clic o toque la lleva al frente |
| Deslizar | arrastre horizontal de más de 48 px (y 1,4 veces más largo que el vertical) sobre el escenario cambia de sabor |

### Gesto de entrada por sabor (botella principal)

Parten de esa posición, con giro, y llegan a su sitio. La de atrás usa el 60 % de estos valores.

| Sabor | Giro | Desde x | Desde y |
|---|---|---|---|
| Fresa | −5° | −26 px | 22 px |
| Piña | 6° | 28 px | 20 px |
| Mora | −4° | −20 px | 28 px |
| Melocotón | 5° | 24 px | 18 px |
| Frutos rojos | −6° | −28 px | 22 px |
| Café | 3° | 16 px | 30 px |
| Guanábana | −5° | −22 px | 20 px |
| Mango | 6° | 26 px | 24 px |

El desplazamiento horizontal solo existe en la botella del hero (es un producto, no una rejilla). Las rejillas solo suben.

## Colores por sabor

Definidos como tokens en `hero.css` (`body[data-flavor="..."]`). `--hero-ink` es el acento oscuro (píldora activa del menú, texto y flecha del botón); `--hero-fg` es el color del texto sobre el fondo. Para la malla se mezclan con `color-mix` hacia blanco, negro y el acento.

| Sabor | Fondo | Mesa | Acento | Texto | Logo |
|---|---|---|---|---|---|
| Fresa | #BC1D29 | #D12430 | #B3141F | blanco | blanco |
| Piña | #E8AB0A | #F2BB1E | #8A5200 | #2E1D00 | oscuro |
| Mora | #74205A | #83286A | #6A1A52 | blanco | blanco |
| Melocotón | #D9570F | #E5681E | #A93D05 | blanco | blanco |
| Frutos rojos | #A8143A | #B91E47 | #9A0F32 | blanco | blanco |
| Café | #55281A | #653424 | #4A2010 | blanco | blanco |
| Guanábana | #347A22 | #418A2D | #2B6A19 | blanco | blanco |
| Mango | #F08A0C | #F89A22 | #9C4E00 | #2E1600 | oscuro |

Piña y Mango llevan texto y logo oscuros porque el blanco sobre amarillo y naranja claro no llega a 3:1. Es la única desviación de la regla "logo blanco sobre fondos de color".

Los puntos del selector (`dot`) están en `js/flavors.js`.

## Menú y barra

- Sobre el hero: transparente. Al bajar más de 24 px pasa a barra crema `rgba(255,247,232,.9)` con `backdrop-filter: blur(14px)` y borde de 1 px (350 ms). El logo cambia entre blanco, oscuro y rojo con un cruce de opacidad de 450 ms.
- Páginas interiores: la barra crema desde el inicio (`site-header--solid`).
- Menú en celular: baja 6 px con fade en 220 ms; Esc cierra y devuelve el foco al botón; Tab queda dentro del menú.

## Resto de la web

- Revelado al hacer scroll: 450 ms, subida 14 px, escalonado de 90 ms entre hermanos (`--i`).
- Tarjetas de producto: entran con 90 ms entre cada una (máximo 0,63 s). Hover: suben 4 px, borde de 1 px que se ilumina (sin sombra grande), imagen escala 1,02 en 400 ms.
- Botones: suben 4 px al pasar el cursor (220 ms) y bajan a 1 px al pulsar. (La skill `motion-design` decía 2 px; se subió a 4 px por pedido del usuario.)
- Menú de usuario: baja 8 px con fade de 150 ms.
- Carrito lateral: vidrio ligero (blur 16 px, borde translúcido).
- Contador del carrito: al cambiar, cuenta de un número al otro en pasos de 55 ms (máx. 8 pasos), cada paso con una entrada de 300 ms desde abajo.

## Sonido

`js/sound.js` deja listo el espacio: apagado por defecto, volumen 0,25, nada al pasar el cursor, nada con movimiento reducido, y el botón de silencio solo aparece si se registra un sonido con `YOGUR_SOUND.register(...)`. Hoy no hay archivos de audio.

## Cómo probar

1. `npx serve frontend -p 4173` (o `python -m http.server 4173` dentro de `frontend`).
2. Abrir `http://localhost:4173/index.html?sabor=mora` para ir directo a un sabor.
3. Probar con el teclado (flechas, Inicio, Fin), con toque y con movimiento reducido activado en el sistema.
4. `npm test` corre `tests/hero.spec.js`, `tienda.spec.js` y `menu-movil.spec.js`.
