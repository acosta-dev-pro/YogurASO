# Skill: Git y revisión de código

**Tipo:** escrita para este proyecto (local).
**Archivo:** `.cursor/skills/git-code-review/SKILL.md`

## Qué cubre

Flujo de Git y revisión de código para YoguraSo: ramas, commits pequeños en español, revisión antes de integrar. Úsala al commitear o revisar cambios.

## Cuándo se usa

Al hacer commits, preparar una rama o revisar cambios.

## Reglas principales

- Se trabaja en `redesign/yoguraso-v2`. `main` solo recibe cambios revisados.
- Commits pequeños, en español, con prefijo: `feat(hero): ...`, `fix(carrito): ...`, `docs: ...`, `chore: ...`, `refactor: ...`, `test: ...`.
- `git add` por ruta; nunca `git add -A` mientras haya archivos ajenos sin seguimiento (`docs/taller-pruebas/`).
- Antes de commitear: `git status`, `git diff --cached`, y buscar secretos.
- Borrados con `git rm`, en commits separados por categoría, anotados en `docs/architecture/ELIMINADOS.md`.

## Lista de comprobación

- [ ] Mensaje en español y con prefijo.
- [ ] Sin archivos ajenos.
- [ ] Sin secretos.
- [ ] Pruebas en verde cuando aplica.
