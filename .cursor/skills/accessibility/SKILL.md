---
name: accessibility
description: Accesibilidad web para YoguraSo: semántica, teclado, foco, contraste y movimiento reducido. Úsala al crear o revisar cualquier interfaz.
---

# Accesibilidad

## Cuándo usarla

En toda interfaz nueva y antes de cerrar una fase.

## Reglas

- HTML semántico y un solo `h1` por página.
- Acción = `<button>`, navegación = `<a>`.
- Texto alternativo en imágenes de producto: sabor y presentación ("Yogurt de fresa, 500 ml"). Decorativas con `alt=""`.
- Etiqueta visible en cada campo y errores asociados al campo.
- Selector de sabores operable con flechas del teclado, Enter y toque, sin flechas visibles en pantalla.
- Menú móvil y cajón del carrito: foco atrapado, Esc cierra, el foco vuelve al botón.
- Contraste 4,5:1 mínimo; comprobar texto blanco sobre amarillo y crema.
- `prefers-reduced-motion`: sin desplazamientos ni cruces largos; el cambio de sabor pasa a un cambio simple.
- Anuncia cambios dinámicos importantes con una región `aria-live` (carrito, errores).

## Cómo trabajar

1. Recorre con teclado.
2. Revisa contraste por color de sabor.
3. Activa movimiento reducido.
4. Corre `check-accessibility`.

## Revisión final

- [ ] Todo el flujo de compra con teclado.
- [ ] Foco siempre visible.
- [ ] Sin `div` clicables.
- [ ] Sin violaciones graves en la prueba automática.
