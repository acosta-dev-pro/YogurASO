# Skill: Three.js / React Three Fiber

**Tipo:** escrita para este proyecto (local).
**Archivo:** `.cursor/skills/threejs-r3f/SKILL.md`

## Qué cubre

3D opcional para YoguraSo con Three.js y React Three Fiber. Úsala solo si se aprueba un caso concreto de 3D.

## Cuándo se usa

Solo cuando el dueño apruebe un uso de 3D (envase giratorio, escena de historia). El hero base es 2D.

## Reglas principales

- El 3D no vuelve la marca una demostración técnica. Se justifica por una necesidad de la marca.
- Escritorio: opcional. Móvil: respaldo 2D obligatorio. Con movimiento reducido: imagen estática.
- Modelos `.glb` con compresión Draco o Meshopt; texturas WebP, AVIF o KTX2; peso total bajo y medido.
- Se carga solo en la ruta que lo usa (importación diferida). No entra en el bundle principal.
- Sin física (Rapier) salvo que aporte algo claro.

## Lista de comprobación

- [ ] Existe el respaldo 2D.
- [ ] No se carga fuera de su ruta.
- [ ] Respeta movimiento reducido.
- [ ] Peso medido y anotado.

## Nota

No está instalado y no se instalará sin aprobación.
