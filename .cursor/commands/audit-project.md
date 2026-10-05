# Auditar el proyecto

## Objetivo

Descubrir qué hay hoy en el repositorio sin cambiar nada.

## Entradas

- Rama actual (`git branch`) y estado (`git status`).
- Carpetas a revisar; por defecto todas.

## Pasos

1. Ejecuta `git status`, `git branch` y `git log -5`. No toques los archivos sin seguimiento de `docs/taller-pruebas/`.
2. Recorre `frontend/`, `backend/`, `database/`, `tests/`, `docs/`, `.github/`, los `.bat`, `package.json` y el README.
3. Para cada archivo anota: propósito, quién lo usa, si está activo, duplicado o muerto.
4. Para decir que algo está sin uso, busca su nombre en todo el proyecto (`git grep -n -i`) y guarda la evidencia.
5. Busca secretos versionados (`.env`, claves, contraseñas). Repórtalos **sin copiar el valor**.
6. Escribe el resultado en `docs/architecture/INFORME_AUDITORIA.md`.

## Criterios de éxito

- Existe el informe con las 13 preguntas respondidas.
- Cada archivo propuesto para eliminar trae evidencia de búsqueda.
- Ningún archivo de la aplicación cambió.

## Archivos que puede modificar

- `docs/architecture/INFORME_AUDITORIA.md`
- `docs/architecture/YOGURASO_PROJECT_MAP_V2.md`

## Archivos que no puede modificar

- Todo `frontend/`, `backend/`, `database/`, `tests/`
- `docs/taller-pruebas/`
- Cualquier `.env`
