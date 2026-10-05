---
name: ui-ux-design
description: Diseño de interfaz y experiencia para YoguraSo: jerarquía, hero de producto, tarjetas, formularios y estados. Úsala al crear o revisar cualquier pantalla.
---

# UI/UX

## Cuándo usarla

Al diseñar o cambiar una pantalla, un componente o un flujo (hero, catálogo, carrito, login, admin).

## Reglas

- Jerarquía fija: producto, marca, mensaje, CTA, navegación, información secundaria. Si algo compite con el producto, se baja.
- Parte de la referencia `docs/design/reference/mockup-hero.png`: fondo del sabor a pantalla completa, producto grande, segundo producto más pequeño atrás, sombra de contacto, sin flechas.
- Cambiar de sabor cambia producto, producto secundario, fondo, texto y acentos a la vez, con una sola transición coordinada.
- Tarjetas con lo justo: producto, nombre, volumen, precio y un botón. Nada de cuatro botones ni de bordes pesados.
- Cada componente define sus estados: normal, hover, foco, activo, desactivado, cargando, error y vacío.
- Formularios: etiqueta visible, ayuda corta, error junto al campo, mensajes en español claro.
- Móvil se diseña primero para móvil: el hero móvil es otro diseño, no el de escritorio encogido.
- Texto de interfaz en español, directo, sin frases de relleno ni tono de plantilla.

## Cómo trabajar

1. Lee `docs/design/DESIGN_GAP_ANALYSIS.md` y `.cursor/rules/03-ui-design.mdc`.
2. Dibuja la jerarquía de la pantalla en una lista antes de escribir código.
3. Usa solo tokens del sistema de diseño.
4. Revisa con el comando `check-design`.

## Revisión final

- [ ] El producto domina la pantalla.
- [ ] No hay flechas de carrusel en el hero.
- [ ] Todos los estados están cubiertos.
- [ ] En móvil se usa con una mano.
- [ ] Los textos no inventan datos del producto.

Complementa con la skill oficial `frontend-design` (ver `.cursor/skills/frontend-design`).
