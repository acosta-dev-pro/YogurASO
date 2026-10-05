# Skill: React y TypeScript

**Tipo:** escrita para este proyecto (local).
**Archivo:** `.cursor/skills/react-typescript/SKILL.md`

## Qué cubre

Convenciones de React + TypeScript para YoguraSo (componentes, hooks, tipos, formularios). Úsala al escribir código del frontend nuevo.

## Cuándo se usa

Al escribir componentes, hooks o tipos en `src/`.

## Reglas principales

- Componentes de función con props tipadas. Sin `any`; si es inevitable, un comentario con el motivo.
- El modelo `Product` es el de `docs/architecture/TARGET_ARCHITECTURE.md`; los tipos de la base se generan con la CLI de Supabase.
- Estado derivado se calcula, no se guarda. Efectos solo para sincronizar con algo externo.
- Hooks con prefijo `use`, uno por responsabilidad (`useCart`, `useActiveFlavor`).
- Listas con `key` estable (el `slug` del producto, no el índice).

## Lista de comprobación

- [ ] `tsc` sin errores.
- [ ] Sin `any` sin justificación.
- [ ] Sin efectos innecesarios.
- [ ] Props y retornos tipados.

## Nota

React y TypeScript no están instalados todavía. Se instalan en la fase 3 (ver ADR-001).
