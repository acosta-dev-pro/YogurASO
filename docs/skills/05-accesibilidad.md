# Skill: Accesibilidad

**Tipo:** escrita para este proyecto (local).
**Archivo:** `.cursor/skills/accessibility/SKILL.md`

## Qué cubre

Accesibilidad web para YoguraSo: semántica, teclado, foco, contraste y movimiento reducido. Úsala al crear o revisar cualquier interfaz.

## Cuándo se usa

En toda interfaz nueva y antes de cerrar una fase.

## Reglas principales

- HTML semántico y un solo `h1` por página.
- Acción = `<button>`, navegación = `<a>`.
- Texto alternativo en imágenes de producto: sabor y presentación ("Yogurt de fresa, 500 ml"). Decorativas con `alt=""`.
- Etiqueta visible en cada campo y errores asociados al campo.
- Selector de sabores operable con flechas del teclado, Enter y toque, sin flechas visibles en pantalla.

## Lista de comprobación

- [ ] Todo el flujo de compra con teclado.
- [ ] Foco siempre visible.
- [ ] Sin `div` clicables.
- [ ] Sin violaciones graves en la prueba automática.
