---
name: seo
description: SEO técnico para YoguraSo: metaetiquetas, Open Graph, sitemap, robots y datos estructurados sin inventar. Úsala al crear páginas o tocar el head.
---

# SEO

## Cuándo usarla

Al crear o cambiar una página, el `head`, el sitemap o los datos de producto.

## Reglas

- Cada página: `title` y `description` propios, `canonical`, Open Graph y tarjeta de Twitter/X, `lang="es"`.
- `og:image` con URL absoluta. Hoy es relativa (`assets/img/Fresa.png`) y no funciona al compartir.
- `sitemap.xml` con el dominio real (hoy tiene `yoguraso.example`) y `robots.txt` apuntando a él con URL absoluta.
- `/admin` y las páginas de cuenta con `noindex`.
- Datos estructurados `Product` solo con datos reales confirmados: nombre, imagen, presentación y precio verdadero. **Sin** `aggregateRating` ni reseñas inventadas.
- Datos estructurados `Organization`/`LocalBusiness` con la dirección real de Tello y Neiva, Huila, cuando el dueño la confirme.
- Encabezados en orden y textos descriptivos; enlaces con texto claro.
- Un sitio hecho con React necesita que cada ruta tenga su título; si hace falta, prerenderizar.

## Cómo trabajar

1. Revisa el `head` de la página.
2. Completa metaetiquetas.
3. Valida datos estructurados con la herramienta de Google.
4. Actualiza el sitemap.

## Revisión final

- [ ] Sin datos inventados.
- [ ] Canonical y Open Graph correctos.
- [ ] Sitemap con dominio real.
