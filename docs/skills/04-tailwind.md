# Skill: Tailwind CSS

**Tipo:** escrita para este proyecto (local).
**Archivo:** `.cursor/skills/tailwind-css/SKILL.md`

## Qué cubre

Uso de Tailwind con tokens de YoguraSo. Úsala al estilizar componentes del frontend nuevo.

## Cuándo se usa

Al dar estilo a componentes en `src/` o al definir el tema.

## Reglas principales

- El tema (colores, fuentes, espaciado, radios, sombras) se define una sola vez con los tokens de `docs/design/PLAN_MAESTRO_REDISENO.md`. Prohibido `bg-[#abc123]` suelto en componentes.
- Colores de sabor como variables CSS (`--flavor-bg`, `--flavor-accent`) que cambian por sabor, para que la transición de fondo sea una interpolación.
- Familias: `font-display` = Fredoka, `font-sans` = Nunito Sans. Ninguna más.
- Espaciado de la escala 4/8. Radios: 10, 16, 24, 32, pill.
- Si una combinación de clases se repite 3 veces, es un componente.

## Lista de comprobación

- [ ] Sin valores arbitrarios repetidos.
- [ ] Contraste revisado por sabor.
- [ ] Respeta `motion-reduce`.

## Nota

Tailwind no está instalado todavía.
