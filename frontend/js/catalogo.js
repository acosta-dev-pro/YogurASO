/**
 * catalogo.js — Datos de producto que no pintan la página.
 * Precio con descuento, botella del sabor, catálogo de respaldo
 * (si Supabase no responde) y el registro que lee la ficha flotante.
 * Las tarjetas siguen en main.js.
 */

const ASSET_BASE = String(location.pathname || '').includes('/pages/') ? '../' : '';

export function assetUrl(rel) {
    const s = String(rel || '');
    if (!s || /^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
    if (s.startsWith('../') || s.startsWith('/')) return s;
    return ASSET_BASE + s.replace(/^\.\//, '');
}

export function salePrice(p) {
    const base = Number(p.precio || 0);
    const off = Number(p.descuento || 0);
    if (!off) return base;
    return Math.max(500, Math.round((base * (1 - off / 100)) / 100) * 100);
}

/** Fondo pastel de la tarjeta: --fondo-claro-<sabor> (brand.css). El hero sigue en --bg-*. */
export function flavorBgVar(slug) {
    const s = String(slug || '');
    return /^[a-z0-9-]+$/.test(s) ? `var(--fondo-claro-${s})` : 'var(--cream, #FFF8F4)';
}

/** Color propio guardado en el panel (hex distinto del crema por defecto) o null. */
export function customHex(c) {
    const s = String(c || '').trim();
    return /^#[0-9A-Fa-f]{6}$/.test(s) && s.toUpperCase() !== '#FFF8F4' ? s : null;
}

/** Variables de acento de la tarjeta (color_acento del panel), o '' si no hay. */
export function accentVars(p) {
    const a = customHex(p?.color_acento);
    return a ? `--producto-card-accent:${a};--yfm-c:${a};` : '';
}

export function matchFlavorSlug(p) {
    const flavors = window.YOGUR_FLAVORS || [];
    const slug = String(p.slug || p.sabor || '').toLowerCase();
    if (slug && flavors.some((f) => f.slug === slug)) return slug;
    const name = String(p.nombre || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const f of flavors) {
        const n = f.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const s = f.slug.replace(/-/g, ' ');
        if (name.includes(n) || name.includes(s) || name.includes(f.slug)) return f.slug;
    }
    return '';
}

export function bottleUrlFor(p) {
    const slug = matchFlavorSlug(p);
    if (slug) return assetUrl(`assets/products/yoguraso-${slug}-500ml-sm.webp`);
    const url = String(p.imagen_url || '');
    if (/yoguraso-[\w-]+-500ml/i.test(url)) return assetUrl(url);
    return assetUrl(url);
}

/** Si Supabase no responde, se muestran los sabores locales. El precio de respaldo no sustituye al de la base. */
export function flavorCatalog() {
    const flavors = window.YOGUR_FLAVORS || [];
    const catOf = {
        fresa: 'Frutales', pina: 'Frutales', mora: 'Frutales', melocoton: 'Frutales',
        mango: 'Frutales', 'frutos-rojos': 'Frutales',
        cafe: 'Especiales', guanabana: 'Especiales'
    };
    return flavors.map((f) => ({
        id: `local-${f.slug}`,
        nombre: f.nombre,
        categoria: catOf[f.slug] || 'Clásicos',
        precio: 6900,
        descuento: 0,
        stock: 99,
        color_fondo: flavorBgVar(f.slug),
        imagen_url: assetUrl(`assets/products/yoguraso-${f.slug}-500ml-sm.webp`),
        slug: f.slug,
        local_only: true
    }));
}

/** Producto listo para la ficha flotante (js/ficha-modal.js): mismo precio, id y stock que la tarjeta. */
export function catalogEntry(p, slug) {
    return { ...p, slug: slug || matchFlavorSlug(p) || p.slug, precio_venta: salePrice(p) };
}

/** Deja los productos a mano de la ficha flotante: window.YogCatalog.bySlug[slug]. */
export function registerCatalog(list) {
    const reg = window.YogCatalog || (window.YogCatalog = { bySlug: {} });
    (list || []).forEach((p) => {
        const slug = matchFlavorSlug(p) || p.slug;
        if (slug && !reg.bySlug[slug]) reg.bySlug[slug] = catalogEntry(p, slug);
    });
    return list;
}

/** Preferir botella recortada si el nombre/sabor coincide. */
export function normalizeProducts(list) {
    return list.map((p) => {
        const bottle = bottleUrlFor(p);
        const slug = matchFlavorSlug(p);
        return {
            ...p,
            imagen_url: bottle || p.imagen_url,
            color_fondo: customHex(p.color_fondo)
                || (/^[a-z0-9-]+$/.test(String(slug)) ? flavorBgVar(slug) : null)
                || (String(p.color_fondo || '').startsWith('var(--fondo-claro-') ? p.color_fondo : null)
                || p.color_fondo,
            slug: p.slug || slug
        };
    });
}
