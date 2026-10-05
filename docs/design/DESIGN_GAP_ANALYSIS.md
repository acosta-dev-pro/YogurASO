# Brecha de diseño: lo que hay vs. lo que muestra el mockup

Referencias usadas: `docs/design/reference/mockup-hero.png` (hero aprobado) y `docs/design/reference/logo-nuevo.png`.

## 1. Lo que muestra el mockup

- Fondo rojo plano de pantalla completa, con una superficie un poco más oscura abajo donde se apoya el envase.
- Barra de navegación en píldora blanca: Sabores (activo, en rojo), Nosotros, Distribuidores, Contacto. Logo a la izquierda; buscar y carrito a la derecha.
- Titular "Yogurt Artesanal" en tipografía redondeada y gruesa, blanca, muy grande; debajo, "El sabor natural en cada momento".
- Botón-ticket crema "Conoce nuestros Sabores" con icono de la fruta y círculo rojo con flecha.
- Envase de Fresa grande a la derecha del centro; envase de Piña más pequeño, atrás y más a la derecha, para dar profundidad. Sombra de contacto suave sobre la superficie.
- Sin flechas de carrusel.

## 2. Lo que hay hoy

| Aspecto | Hoy | Mockup | Brecha |
|---------|-----|--------|--------|
| Logo | Texto "YogurASO" escrito con fuente (Lobster) | Logo gráfico "YoguraSo" con una Y orgánica y hoja verde | Total. Falta el SVG |
| Nombre | "YogurASO" | "YoguraSo" | Cambiar en todo el HTML, correos y WhatsApp |
| Tipografía | Lobster, Plus Jakarta Sans, Outfit (3 familias, vía `@import`) | Fredoka + Nunito Sans (2 familias) | Cambio completo |
| Color de marca | `#E08888` rosa apagado y pasteles | Rojo `#E51D2A` y fondo por sabor | Cambio completo |
| Fondo del hero | Imagen de fresa sin fondo sobre color claro | Color sólido que cambia con el sabor | Nuevo componente |
| Producto | Una imagen (`fresa sin fondo.png`, 979 KB) | Dos envases, con profundidad y sombra de contacto | Nuevo componente |
| Cambio de sabor | No existe en el hero | Selector sin flechas, con transición coordinada de fondo, producto, texto y acentos | Nuevo componente |
| Navegación | Barra con enlaces y menú de tres rayas en móvil | Píldora blanca con ítem activo en rojo | Rediseño |
| CTA | Botón "Ver Sabores" | Botón-ticket con icono y flecha | Rediseño |
| Titular | "Delicioso Yogurt Artesanal" | "Yogurt Artesanal" | Texto nuevo |
| Iconos | Font Awesome 6.0.0-beta3 por CDN | Iconos propios (fruta, lupa, carrito) | Reemplazar por SVG |
| Tarjetas de producto | Pasteles por categoría, `color_fondo` por producto | Packshot sobre color del sabor | Rediseño |
| Fotos de producto | 10 imágenes viejas sin usar y `fresa sin fondo.png` | PNG transparente de envases con geometría idéntica | Falta recortar (ver `INVENTARIO_ASSETS.md`) |

## 3. Sistema de diseño

| Tema | Hoy | Plan |
|------|-----|------|
| Variables | ~25 variables CSS en `styles.css` (colores, sombras, 2 radios, fuentes) | Tokens centralizados: color, espaciado 4/8, radios 10/16/24/32/pill, sombras suaves |
| Espaciado | Valores sueltos en cada regla | Escala 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128 |
| Radios | `--radius: 16px`, `--radius-sm: 12px` | sm 10, md 16, lg 24, xl 32, pill 999 |
| Sombras | Sombras con tinte rosa | Sombras difusas, contacto de producto, nada de negro pesado |
| Componentes | Clases repetidas entre `shop-ui.css`, `cards-*.css` y `styles.css` | Componentes con una sola fuente de verdad |
| Responsive | 35 consultas `@media` en 7 archivos | Móvil, tablet, escritorio y escritorio ancho; el hero móvil se rediseña, no se encoge |

## 4. Accesibilidad

Lo que ya existe y debe conservarse: enlace "Saltar al contenido", `lang="es"`, `aria-label` en el contador del carrito, diálogos con `role="dialog"`, cierre con Escape en los diálogos.

Lo que falta o hay que revisar:

- Solo hay 1 regla `prefers-reduced-motion` en todo el CSS y 9 de `:focus-visible`. Hay que cubrir `prefers-reduced-motion` en el hero nuevo, que sí anima. Además hay 25 usos de `backdrop-filter` (efecto vidrio) que conviene reducir: el plan pide vidrio solo donde tenga sentido.
- `onclick` directo en un `button` del hero y `div` con `role="button"` en el cierre del carrito: usar botones reales.
- Menú móvil sin foco atrapado.
- El cajón del carrito no atrapa el foco ni se cierra al navegar.
- Contraste: texto blanco sobre amarillo (Piña) y crema (Banano) puede fallar; hay que medirlo por sabor.

## 5. Rendimiento

- 4 imágenes en uso pesan entre 1 y 2,3 MB cada una.
- `styles.css` pesa 88 KB y se carga entero en todas las páginas.
- Fuentes por `@import` dentro del CSS (bloquea el render); conviene `<link rel="preconnect">` o autoalojar WOFF2.
- En `index.html` solo 2 líneas llevan `width` o `loading="lazy"`; el resto de imágenes puede provocar saltos de diseño.

## 6. SEO

Tiene `title`, `description`, `robots`, `og:*`, `twitter:card`, `sitemap.xml` y `robots.txt`. Falta: `canonical`, `og:image` con URL absoluta (hoy apunta a `assets/img/Fresa.png` relativo), datos estructurados `Product` solo cuando haya precios reales confirmados, y un dominio real en el sitemap.

## 7. Textos de marca que hay que validar antes de publicar

El plan prohíbe inventar información. Estos textos ya existen en el proyecto y conviene que el dueño confirme que son ciertos:

- "Sin aditivos ni conservantes" (hero actual).
- "Alto en proteína" y "Bajo en azúcar" (descripciones sembradas en la base de datos).
- Las etiquetas del envase del mockup dicen "100 % natural", "sin colorantes" y "alto en proteína".

## 8. Cambios obligatorios para el hero de referencia

1. Logo en SVG (principal rojo y versión blanca).
2. PNG transparentes de cada envase con la misma geometría (hoy solo hay JPEG con fondo pintado).
3. Fredoka y Nunito Sans cargadas con `font-display: swap`.
4. Tokens de color por sabor como datos.
5. Componente `ProductShowcase` con estado compartido (sabor activo y siguiente).
6. Transición coordinada de fondo, producto, texto y acentos, con respaldo para `prefers-reduced-motion`.
7. Hero móvil propio con selector horizontal.
