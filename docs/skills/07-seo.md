# Skill: SEO

**Tipo:** escrita para este proyecto (local).
**Archivo:** `.cursor/skills/seo/SKILL.md`

## Qué cubre

SEO técnico para YoguraSo: metaetiquetas, Open Graph, sitemap, robots y datos estructurados sin inventar. Úsala al crear páginas o tocar el head.

## Cuándo se usa

Al crear o cambiar una página, el `head`, el sitemap o los datos de producto.

## Reglas principales

- Cada página: `title` y `description` propios, `canonical`, Open Graph y tarjeta de Twitter/X, `lang="es"`.
- `og:image` con URL absoluta. Hoy es relativa (`assets/img/Fresa.png`) y no funciona al compartir.
- `sitemap.xml` con el dominio real (hoy tiene `yoguraso.example`) y `robots.txt` apuntando a él con URL absoluta.
- `/admin` y las páginas de cuenta con `noindex`.
- Datos estructurados `Product` solo con datos reales confirmados: nombre, imagen, presentación y precio verdadero. **Sin** `aggregateRating` ni reseñas inventadas.

## Lista de comprobación

- [ ] Sin datos inventados.
- [ ] Canonical y Open Graph correctos.
- [ ] Sitemap con dominio real.
