---
name: threejs-r3f
description: 3D opcional para YoguraSo con Three.js y React Three Fiber. Úsala solo si se aprueba un caso concreto de 3D.
---

# Three.js / React Three Fiber

## Cuándo usarla

Solo cuando el dueño apruebe un uso de 3D (envase giratorio, escena de historia). El hero base es 2D.

## Reglas

- El 3D no vuelve la marca una demostración técnica. Se justifica por una necesidad de la marca.
- Escritorio: opcional. Móvil: respaldo 2D obligatorio. Con movimiento reducido: imagen estática.
- Modelos `.glb` con compresión Draco o Meshopt; texturas WebP, AVIF o KTX2; peso total bajo y medido.
- Se carga solo en la ruta que lo usa (importación diferida). No entra en el bundle principal.
- Sin física (Rapier) salvo que aporte algo claro.
- Librerías: `three`, `@react-three/fiber`, `@react-three/drei`. Versiones fijas.
- El modelo respeta la geometría única del envase.
- Detecta WebGL y falla con elegancia a la imagen 2D.

## Cómo trabajar

1. Escribe el caso de uso y el aprobador.
2. Haz el respaldo 2D primero.
3. Añade el 3D por encima.
4. Mide el peso y los cuadros por segundo en un teléfono modesto.

## Revisión final

- [ ] Existe el respaldo 2D.
- [ ] No se carga fuera de su ruta.
- [ ] Respeta movimiento reducido.
- [ ] Peso medido y anotado.

No está instalado y no se instalará sin aprobación.
