---
name: web-performance
description: Rendimiento para YoguraSo: imágenes, fuentes, carga diferida, bundle y métricas. Úsala al añadir imágenes, librerías o animaciones.
---

# Rendimiento web

## Cuándo usarla

Al agregar imágenes, fuentes, librerías, animaciones o 3D, y antes de cerrar una fase.

## Reglas

- Los envases PNG se optimizan; objetivo menor a 300 KB cada uno. Tamaños responsivos con `srcset` cuando haga falta.
- La imagen del hero se precarga; las demás, `loading="lazy"`. Siempre con `width` y `height`.
- Dos fuentes, con `swap`. Mejor alojadas en el proyecto en WOFF2.
- Partir el código por ruta. El panel admin y Three.js solo se descargan donde se usan.
- Sin sonido ni modelos 3D antes de que la persona interactúe.
- Cada librería nueva se justifica con su peso.
- Evitar saltos de diseño: reservar el espacio del hero y de las tarjetas.
- Medir con Lighthouse y registrar LCP, CLS y TBT.

## Cómo trabajar

1. Mide antes de cambiar.
2. Cambia una cosa.
3. Mide después.
4. Guarda el resultado en `docs/qa/PERFORMANCE_CHECKLIST.md`.

## Revisión final

- [ ] LCP menor a 2,5 s en móvil simulado.
- [ ] CLS menor a 0,1.
- [ ] Ninguna imagen grande sin justificar.
