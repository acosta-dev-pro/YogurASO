---
name: motion-design
description: Animación con propósito para YoguraSo: transición del hero, entrada escalonada, microinteracciones. Úsala al animar algo.
---

# Motion (movimiento)

## Cuándo usarla

Al animar el hero, tarjetas, botones, el selector de sabores o el carrito.

## Reglas

- Solo se anima para comunicar entrada, estado, relación o respuesta.
- Entrada de grupos: opacidad 0 a 1, subir de 16 px a 0, de 0,35 a 0,5 s, escalonado de 80 a 120 ms.
- Cambio de sabor: el fondo se interpola (no salta) y el producto se siente la misma botella que cambia, no otra página.
- Botón al pasar el cursor: sube 2 px, escala 1,01. Tarjeta: sube 4 px, imagen escala 1,02.
- Selector activo: píldora activa, indicador y color en transición.
- Añadir al carrito: respuesta visual breve, contador animado, aviso discreto.
- Framer Motion para interfaz; GSAP solo para líneas de tiempo o scroll complejos; nunca los dos para lo mismo.
- Anima `transform` y `opacity`; evita animar tamaño o posición que reorganizan la página.
- Con `prefers-reduced-motion`, quitar desplazamientos y dejar cruces mínimos.
- Sin sonido automático. Sin sonido en hover.

## Cómo trabajar

1. Escribe qué comunica la animación en una frase.
2. Si no hay frase, no la hagas.
3. Prueba con movimiento reducido.
4. Mide que no baje el rendimiento.

## Revisión final

- [ ] Duraciones dentro de rango.
- [ ] Respeta movimiento reducido.
- [ ] Nada se anima solo por adorno.

Ver `docs/design/PLAN_MAESTRO_REDISENO.md`, secciones 12 a 15 y 18.
