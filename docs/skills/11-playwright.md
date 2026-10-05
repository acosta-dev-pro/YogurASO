# Skill: Playwright (pruebas y automatización del navegador)

**Tipo:** oficial, copiada tal cual desde el repositorio de Microsoft.
**Archivos:** `.cursor/skills/playwright-cli/`
**Origen:** https://github.com/microsoft/playwright-cli (licencia Apache 2.0; commit y fecha en `SOURCE.md`)

## Qué cubre

Automatizar el navegador desde la línea de comandos, generar pruebas, grabar trazas, simular peticiones, guardar sesiones y trabajar con las pruebas de Playwright.

## Cuándo se usa

Al escribir o depurar pruebas en `tests/`, al reproducir un error visual y con el comando `run-tests`.

## Cómo se aplica en YoguraSo

- El proyecto ya tiene Playwright (`@playwright/test`) y `playwright.config.js`, que sirve `frontend/` en el puerto 4173.
- Pruebas actuales: 4, en `tests/tienda.spec.js` y `tests/menu-movil.spec.js`.
- Pruebas por crear según el plan: `home`, `products`, `cart`, `auth`, `admin`, `responsive`, `accessibility`.
- Regla: `.cursor/rules/09-testing.mdc`.

## Aviso

La skill sugiere instalar `@playwright/cli` de forma global si no existe. **No se instaló.** Si hace falta, se pide permiso primero. Con lo que el proyecto ya tiene (`npx playwright`) alcanza para empezar.

## Lista de comprobación

- [ ] Cada flujo crítico tiene su prueba.
- [ ] Se prueba en 1280 px y en 390 px.
- [ ] Se usan roles y etiquetas, no clases CSS.
- [ ] `npm test` en verde antes de cerrar una fase.
