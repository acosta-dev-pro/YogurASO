# Correr las pruebas

## Objetivo

Ejecutar la batería de pruebas y reportar el resultado en claro.

## Entradas

- Alcance: todo o un archivo.
- Navegador por defecto: Chromium.

## Pasos

1. Confirma la rama con `git branch`.
2. Si faltan dependencias, avisa al usuario. No instales nada sin permiso.
3. Corre `npm run build` si existe, y luego `npm test`.
4. Si una prueba falla, lee el error, el rastro y la captura en `test-results/`. Distingue: fallo real, prueba desactualizada por el rediseño o problema de entorno.
5. Resume: pasaron, fallaron, causa probable de cada fallo.

## Criterios de éxito

- `npm test` sin errores, o lista de fallos explicados.
- Cada fallo clasificado como real, desactualizado o de entorno.

## Archivos que puede modificar

- `tests/**`
- `playwright.config.js`

## Archivos que no puede modificar

- Código de la aplicación para hacer pasar una prueba sin entender el fallo
- `playwright-report/`, `test-results/` (se generan solos)
