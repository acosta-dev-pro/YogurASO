# Skill: Rendimiento web

**Tipo:** escrita para este proyecto (local).
**Archivo:** `.cursor/skills/web-performance/SKILL.md`

## Qué cubre

Rendimiento para YoguraSo: imágenes, fuentes, carga diferida, bundle y métricas. Úsala al añadir imágenes, librerías o animaciones.

## Cuándo se usa

Al agregar imágenes, fuentes, librerías, animaciones o 3D, y antes de cerrar una fase.

## Reglas principales

- Los envases PNG se optimizan; objetivo menor a 300 KB cada uno. Tamaños responsivos con `srcset` cuando haga falta.
- La imagen del hero se precarga; las demás, `loading="lazy"`. Siempre con `width` y `height`.
- Dos fuentes, con `swap`. Mejor alojadas en el proyecto en WOFF2.
- Partir el código por ruta. El panel admin y Three.js solo se descargan donde se usan.
- Sin sonido ni modelos 3D antes de que la persona interactúe.

## Lista de comprobación

- [ ] LCP menor a 2,5 s en móvil simulado.
- [ ] CLS menor a 0,1.
- [ ] Ninguna imagen grande sin justificar.
