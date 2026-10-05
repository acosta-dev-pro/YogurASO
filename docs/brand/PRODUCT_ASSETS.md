# Assets de producto y logo

Resultado del recorte de las fotos originales de `assets-source/products-raw/`.

## Botellas (`public/products/`)

Ocho sabores: café, fresa, frutos rojos, guanábana, mango, melocotón, mora y piña.

- Por sabor hay tres archivos: `yoguraso-<sabor>-500ml.png` (PNG indexado, entre 220 y 255 KB), `yoguraso-<sabor>-500ml.webp` (entre 90 y 110 KB, el que usa la web) y `yoguraso-<sabor>-500ml-sm.webp` (mitad de tamaño, para miniaturas).
- Todas comparten lienzo de 640 x 1110 px, la misma escala (alto del envase 1100 px) y el envase pegado al borde inferior. Así la tapa, el asa y la base quedan en el mismo sitio en todos los sabores. No se deformó ninguna botella: solo se recortó y se escaló todo por igual.
- Método: segmentación con isnet (rembg), después se quedó solo el componente más grande (fuera salpicaduras sueltas), se suavizó el contorno, se retiraron 2 px de borde y se reemplazó el color de la franja del borde por el color vecino interior para quitar halos del cuadro gris/blanco o del fondo negro. El hueco del asa se conserva.

### Fresa maestra

La maestra es `yoguraso-fresa-500ml-raw.jpeg` (la del cuadro de transparencia). Tiene la misma geometría que los otros siete sabores (proporción 0,544) y la misma que el mockup. La foto `fresa-grande` tiene más resolución pero un envase más ancho (0,616), así que no encaja con el resto. Su recorte queda guardado en `assets-source/products-cutout-alt/`, sin usar.

### Pendiente

Faltan los sabores Griego, Maracuyá, Cereza, Banano y Coco (no hay foto).

## Logo (`brand/`)

`logo-primary.svg`, `logo-white.svg` y `logo-dark.svg` se vectorizaron a partir de `docs/design/reference/logo-nuevo.png` (rojo y hoja por separado, con vtracer). La hoja conserva el verde en las tres versiones. Falta `logo-mark.svg` (solo el símbolo) y el favicon nuevo.
