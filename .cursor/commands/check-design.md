# Revisar el diseño

## Objetivo

Comprobar que una pantalla cumple el sistema de diseño y la referencia del hero.

## Entradas

- Página o componente a revisar.
- Imagen de referencia: `docs/design/reference/mockup-hero.png`.

## Pasos

1. Abre `docs/design/PLAN_MAESTRO_REDISENO.md` (secciones 1 a 4, 11 a 13, 18 y 42 a 44).
2. Revisa tipografía (Fredoka y Nunito Sans, nada más), colores del token, espaciado 4/8, radios y sombras.
3. Revisa la jerarquía: producto, marca, mensaje, CTA, navegación.
4. Revisa el hero: sin flechas, producto grande, segundo producto más pequeño, fondo del sabor, sombra de contacto, transición coordinada.
5. Revisa que el logo sea el archivo real y no texto, y que los envases no estén deformados.
6. Revisa hover, focus, active, loading, error y vacío.
7. Anota problemas en una lista con ruta y línea.

## Criterios de éxito

- Cero valores visuales sueltos fuera de los tokens.
- Se cumplen los criterios de aceptación de las secciones 42 y 43 del plan.
- Lista de problemas entregada, ordenada por gravedad.

## Archivos que puede modificar

- Estilos y componentes de la pantalla revisada
- `docs/design/*.md`

## Archivos que no puede modificar

- `backend/`, `supabase/migrations/` aplicadas
- Logos y envases originales (`brand/`, `public/products/`)
