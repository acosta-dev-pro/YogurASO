---
name: react-typescript
description: Convenciones de React + TypeScript para YoguraSo (componentes, hooks, tipos, formularios). Úsala al escribir código del frontend nuevo.
---

# React y TypeScript

## Cuándo usarla

Al escribir componentes, hooks o tipos en `src/`.

## Reglas

- Componentes de función con props tipadas. Sin `any`; si es inevitable, un comentario con el motivo.
- El modelo `Product` es el de `docs/architecture/TARGET_ARCHITECTURE.md`; los tipos de la base se generan con la CLI de Supabase.
- Estado derivado se calcula, no se guarda. Efectos solo para sincronizar con algo externo.
- Hooks con prefijo `use`, uno por responsabilidad (`useCart`, `useActiveFlavor`).
- Listas con `key` estable (el `slug` del producto, no el índice).
- Formularios controlados y validados con un esquema; los mensajes de error se muestran en español.
- Importa componentes pesados con carga diferida (`lazy`) por ruta.
- Nunca uses `dangerouslySetInnerHTML` con datos de personas.

## Cómo trabajar

1. Escribe primero el tipo.
2. Escribe el componente más pequeño que funcione.
3. Cubre estados de carga, error y vacío.
4. Agrega la prueba del flujo.

## Revisión final

- [ ] `tsc` sin errores.
- [ ] Sin `any` sin justificación.
- [ ] Sin efectos innecesarios.
- [ ] Props y retornos tipados.

React y TypeScript no están instalados todavía. Se instalan en la fase 3 (ver ADR-001).
