# Inventario de assets

Estado al 4 de octubre de 2026 de las imágenes y del logo que entregó el dueño.

## 1. Sabores recibidos (9 fotos)

Originales en `C:\Users\acost\Downloads\WhatsApp Unknown 2026-10-04 at 9.37.56 PM\`. Copias en `assets-source/products-raw/`. El orden se confirmó mirando la hoja de contacto 3×3 que armó el equipo y comparándola con las fotos una por una.

| # | Sabor | Archivo en el proyecto | Archivo original (WhatsApp, 4 oct 2026) | Tamaño | Píxeles | Fondo |
|---|-------|------------------------|------------------------------------------|--------|---------|-------|
| 1 | Guanábana | `yoguraso-guanabana-500ml-raw.jpeg` | `...at 9.36.01 PM (1).jpeg` | 298.202 B | 1034 × 1521 | Cuadro de transparencia pintado |
| 2 | Café | `yoguraso-cafe-500ml-raw.jpeg` | `...at 9.36.01 PM (2).jpeg` | 311.842 B | 1034 × 1521 | Cuadro de transparencia pintado |
| 3 | Mango | `yoguraso-mango-500ml-raw.jpeg` | `...at 9.36.01 PM.jpeg` | 304.286 B | 1034 × 1521 | Cuadro de transparencia pintado |
| 4 | Melocotón | `yoguraso-melocoton-500ml-raw.jpeg` | `...at 9.36.02 PM (1).jpeg` | 309.281 B | 1034 × 1521 | Cuadro de transparencia pintado |
| 5 | Fresa | `yoguraso-fresa-500ml-raw.jpeg` | `...at 9.36.02 PM (2).jpeg` | 329.121 B | 1034 × 1521 | Cuadro de transparencia pintado |
| 6 | Piña | `yoguraso-pina-500ml-raw.jpeg` | `...at 9.36.02 PM (3).jpeg` | 294.832 B | 1034 × 1520 | Cuadro de transparencia pintado |
| 7 | Mora | `yoguraso-mora-500ml-raw.jpeg` | `...at 9.36.02 PM (4).jpeg` | 159.745 B | 1034 × 1520 | Negro |
| 8 | Fresa (versión grande) | `yoguraso-fresa-grande-500ml-raw.jpeg` | `...at 9.36.02 PM (5).jpeg` | 200.666 B | 1052 × 1495 | Negro |
| 9 | Frutos rojos | `yoguraso-frutos-rojos-500ml-raw.jpeg` | `...at 9.36.02 PM.jpeg` | 320.408 B | 1034 × 1521 | Cuadro de transparencia pintado |

El orden es el alfabético del nombre original (los paréntesis van antes del punto).

## 2. Sabores que faltan (5)

El plan maestro lista 13 sabores. Faltan las fotos de:

1. Yogur Griego
2. Maracuyá
3. Cereza
4. Banano
5. Coco

Color de fondo previsto en el plan para cada uno: Griego azul suave, Maracuyá amarillo intenso, Cereza rojo cereza oscuro, Banano amarillo crema, Coco turquesa o blanco.

## 3. El problema de las fotos

Son **JPEG**. Un JPEG no puede tener transparencia. En 7 de las 9 fotos el fondo es el dibujo de cuadritos grises y blancos que los programas muestran para "transparente", pero aquí está pintado como parte de la imagen. En las otras 2 (Mora y Fresa grande) el fondo es negro.

Consecuencias:

- No se pueden poner sobre un fondo de color: se vería el cuadriculado o el negro.
- Hay que **recortar el envase** y guardarlo como **PNG con transparencia** antes de usarlo en la web.
- El recorte debe incluir la sombra de contacto como capa aparte, no pegada al envase.
- En los bordes del plástico brillante y de la tapa el recorte es delicado: hay que revisar el halo.

Además:

- **Encuadre.** Siete fotos miden 1034 × 1521 y dos 1034 × 1520, con el envase en la misma posición. La de Fresa grande (1052 × 1495) tiene el envase más grande dentro del cuadro y otra distribución de la etiqueta. No se puede mezclar con las demás sin reencuadrarla.
- **Dos fresas.** Hay dos versiones del envase de Fresa (#5 y #8). El plan dice que la Fresa aprobada es la plantilla maestra de proporción. **Falta que el dueño confirme cuál es.**
- **Etiquetas.** En las fotos el envase dice "500 ml". Antes de publicar hay que revisar que todos los textos de la etiqueta están bien escritos (nombre del sabor, "contenido neto", los tres íconos de la base).
- **Resolución.** 1034 × 1521 sirve para el hero a tamaño normal; para pantallas de alta densidad conviene pedir versiones más grandes.
- **Peso.** Cada PNG transparente de ese tamaño pesa más que el JPEG; hay que optimizarlo (meta: menos de 300 KB).

## 4. Qué hay que hacer

1. Confirmar cuál es el envase de Fresa maestro.
2. Recortar los 9 envases a PNG transparente con la misma escala y posición.
3. Guardarlos en `public/products/` como `yoguraso-<sabor>-500ml.png` (por ejemplo `yoguraso-pina-500ml.png`).
4. Conseguir los 5 sabores que faltan.
5. Anotar en `ELIMINADOS.md` cualquier imagen vieja que se retire.

## 5. Logo

| Archivo | Estado |
|---------|--------|
| `docs/design/reference/logo-nuevo.png` | Referencia. PNG de 1024 × 409 sobre fondo crema. Logo rojo con la Y orgánica y la hoja verde |
| `brand/logo-primary.svg`, `logo-white.svg`, `logo-dark.svg`, `logo-mark.svg`, `favicon.svg` | **Pendientes.** El plan pide SVG real, no un PNG ni texto con una fuente. Falta el archivo vectorial original o que un diseñador lo vectorice |

## 6. Mockup

`docs/design/reference/mockup-hero.png`: hero de referencia (Fresa al frente, Piña atrás, fondo rojo). Análisis en `DESIGN_GAP_ANALYSIS.md`.

## 7. Imágenes viejas del sitio

Quedan 4 en `frontend/assets/img/` porque `index.html` las usa: `Fresa.png`, `fresa sin fondo.png` (idéntica a la anterior), `leche.jpg` y `fresitas.png`. Se reemplazan al construir el hero. Las otras 10 se eliminaron (ver `ELIMINADOS.md`).
