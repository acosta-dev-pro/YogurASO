---
name: git-code-review
description: Flujo de Git y revisión de código para YoguraSo: ramas, commits pequeños en español, revisión antes de integrar. Úsala al commitear o revisar cambios.
---

# Git y revisión de código

## Cuándo usarla

Al hacer commits, preparar una rama o revisar cambios.

## Reglas

- Se trabaja en `redesign/yoguraso-v2`. `main` solo recibe cambios revisados.
- Commits pequeños, en español, con prefijo: `feat(hero): ...`, `fix(carrito): ...`, `docs: ...`, `chore: ...`, `refactor: ...`, `test: ...`.
- `git add` por ruta; nunca `git add -A` mientras haya archivos ajenos sin seguimiento (`docs/taller-pruebas/`).
- Antes de commitear: `git status`, `git diff --cached`, y buscar secretos.
- Borrados con `git rm`, en commits separados por categoría, anotados en `docs/architecture/ELIMINADOS.md`.
- Un commit gigante no se revisa. Si no cabe en una frase, se parte.
- No `git push`, no `--force`, no reescribir historia publicada sin pedir permiso.
- Para revisar: ¿hace lo que dice?, ¿rompe algo?, ¿hay secretos?, ¿hay pruebas?, ¿se entiende en 6 meses?

## Cómo trabajar

1. Mira el estado.
2. Agrega por ruta.
3. Revisa lo que se va a commitear.
4. Commit con mensaje claro.

## Revisión final

- [ ] Mensaje en español y con prefijo.
- [ ] Sin archivos ajenos.
- [ ] Sin secretos.
- [ ] Pruebas en verde cuando aplica.
