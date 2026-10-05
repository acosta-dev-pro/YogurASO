---
name: tailwind-css
description: Uso de Tailwind con tokens de YoguraSo. Úsala al estilizar componentes del frontend nuevo.
---

# Tailwind CSS

## Cuándo usarla

Al dar estilo a componentes en `src/` o al definir el tema.

## Reglas

- El tema (colores, fuentes, espaciado, radios, sombras) se define una sola vez con los tokens de `docs/design/PLAN_MAESTRO_REDISENO.md`. Prohibido `bg-[#abc123]` suelto en componentes.
- Colores de sabor como variables CSS (`--flavor-bg`, `--flavor-accent`) que cambian por sabor, para que la transición de fondo sea una interpolación.
- Familias: `font-display` = Fredoka, `font-sans` = Nunito Sans. Ninguna más.
- Espaciado de la escala 4/8. Radios: 10, 16, 24, 32, pill.
- Si una combinación de clases se repite 3 veces, es un componente.
- Usa variantes `focus-visible`, `motion-reduce` y `disabled`.
- Móvil primero: clases base para móvil y `md:`/`lg:` para ampliar.
- No mezcles Tailwind con CSS suelto para lo mismo.

## Cómo trabajar

1. Revisa si el token existe.
2. Si no existe, agrégalo al tema y documéntalo.
3. Escribe el componente con clases del tema.
4. Revisa en 390 px y 1280 px.

## Revisión final

- [ ] Sin valores arbitrarios repetidos.
- [ ] Contraste revisado por sabor.
- [ ] Respeta `motion-reduce`.

Tailwind no está instalado todavía.
