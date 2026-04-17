/**
 * catalogo.js — Lógica centralizada de precios, presentaciones, imágenes y catálogo compartido.
 * Conecta los datos de productos (Supabase + Admin) con el carrusel del inicio,
 * la página de catálogo, la ficha emergente (ficha-modal.js) y el carrito.
 */

import { fetchProducts } from './api.js';

const ASSET_BASE = String(location.pathname || '').includes('/pages/') ? '../' : '';

/** Resuelve rutas relativas de recursos según si estamos en la raíz o en /pages/. */
export function assetUrl(rel) {
    const s = String(rel || '').trim();
    if (!s || /^(https?:|data:|blob:)/i.test(s)) return s;
    if (s.startsWith('../') || s.startsWith('/')) return s;
    return ASSET_BASE + s.replace(/^\.\//, '');
}

/**
 * Precio base (sin descuento) según la presentación seleccionada ('500 ml' o '1 Litro').
 * Si el administrador configuró `precio_1l`, lo usa directamente; si no, aplica el factor 1.75x.
 */
export function basePriceForSize(p, size = '500 ml') {
    const base500 = Number(p?.precio || 0);
    if (!base500) return 0;
    const s = String(size || '').toLowerCase();
    if (s.includes('1 l') || s.includes('litro') || s === '1000') {
        const custom1L = Number(p?.precio_1l || 0);
        if (custom1L > 0) return custom1L;
        return Math.round((base500 * 1.75) / 100) * 100;
    }
    return base500;
}

/**
 * Precio final de venta (aplicando el porcentaje de descuento si existe) para cualquier tamaño.
 */
export function priceForSize(p, size = '500 ml') {
    const base = basePriceForSize(p, size);
    if (!base) return 0;
    const off = Number(p?.descuento || 0);
    if (!off || off <= 0) return base;
    return Math.max(500, Math.round((base * (1 - off / 100)) / 100) * 100);
}

/** Precio final de venta para la presentación estándar de 500 ml. */
export function salePrice(p) {
    return priceForSize(p, '500 ml');
}

/** Variable CSS del fondo pastel oficial del sabor: --fondo-claro-<sabor> (brand.css). */
export function flavorBgVar(slug) {
    const s = String(slug || '');
    return /^[a-z0-9-]+$/.test(s) ? `var(--fondo-claro-${s})` : 'var(--cream, #FFF8F4)';
}

/** Color hexadecimal personalizado guardado desde el panel admin (distinto del crema neutro). */
export function customHex(c) {
    const s = String(c || '').trim();
    return /^#[0-9A-Fa-f]{6}$/.test(s) && s.toUpperCase() !== '#FFF8F4' ? s : null;
}

/** Los ids 1..8 de la tabla products son los sabores originales; todo id mayor es un producto creado desde el Admin. */
const OFFICIAL_MAX_ID = 8;

const OFFICIAL_FLAVOR_SLUGS = new Set([
    'fresa', 'pina', 'mora', 'melocoton', 'frutos-rojos', 'cafe', 'guanabana', 'mango', 'griego'
]);

/** Identifica a qué sabor pertenece un producto por su slug, sabor o nombre. */
export function matchFlavorSlug(p) {
    if (!p) return '';
    const rawSlug = String(p.slug || p.sabor || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // 1. Si coincide exactamente con un sabor oficial y es producto oficial (o no es custom)
    const isCustom = Boolean(p.is_custom || (p.id != null && Number(p.id) > OFFICIAL_MAX_ID));
    if (rawSlug && OFFICIAL_FLAVOR_SLUGS.has(rawSlug) && !isCustom) return rawSlug;

    const flavors = window.YOGUR_FLAVORS || [];
    if (rawSlug && flavors.some((f) => f.slug === rawSlug) && !isCustom) return rawSlug;

    // 2. Mapeo estricto por ID oficial si falta el slug
    const officialById = {
        '1': 'fresa', '2': 'pina', '3': 'mora', '4': 'melocoton',
        '5': 'frutos-rojos', '6': 'mango', '7': 'cafe', '8': 'guanabana', '11': 'griego'
    };
    if (p.id != null && officialById[String(p.id)]) {
        return officialById[String(p.id)];
    }

    // 3. Mapeo por nombre EXACTO (solo para productos oficiales)
    if (!isCustom) {
        const name = String(p.nombre || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        for (const f of flavors) {
            if (!OFFICIAL_FLAVOR_SLUGS.has(f.slug)) continue;
            const n = f.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            if (name === n || name === `yogur de ${n}` || name === `yogurt de ${n}`) return f.slug;
        }
    }
    // Producto del Admin cuyo nombre coincide con un sabor oficial: mismo sufijo que usa theme-reactor.js
    // para que ambos módulos lo traten como un sabor distinto y no reutilicen la botella/colores del oficial.
    if (isCustom && OFFICIAL_FLAVOR_SLUGS.has(rawSlug) && p.id != null) return rawSlug + '-' + p.id;
    return rawSlug || '';
}

/**
 * Devuelve la imagen óptima de la botella:
 * - Si el admin subió una foto personalizada (Storage / dataURL / URL externa), la respeta siempre.
 * - Si el admin eligió una botella específica en assets/products/, la respeta.
 * - Si corresponde a un sabor oficial sin imagen personalizada, usa el recorte optimizado de alta nitidez.
 */
export function bottleUrlFor(p) {
    if (!p) return assetUrl('assets/products/yoguraso-fresa-500ml-sm.webp');
    const url = String(p.imagen_url || '').trim();
    if (url && !/i\.ibb\.co/i.test(url)) {
        if (/^(data:|blob:|https?:)/i.test(url) || /\/storage\/v1\/object\/public\//i.test(url)) {
            return url;
        }
        return assetUrl(url.replace(/^(\.\.\/)+/, ''));
    }

    const slug = matchFlavorSlug(p);
    if (slug && OFFICIAL_FLAVOR_SLUGS.has(slug)) {
        return assetUrl(`assets/products/yoguraso-${slug}-500ml-sm.webp`);
    }
    return assetUrl('assets/products/yoguraso-fresa-500ml-sm.webp');
}

/** Catálogo de respaldo local en caso de pérdida total de conexión. */
export function flavorCatalog() {
    const flavors = (window.YOGUR_FLAVORS || []).filter((f) => OFFICIAL_FLAVOR_SLUGS.has(f.slug));
    const catOf = {
        fresa: 'Frutales', pina: 'Frutales', mora: 'Frutales', melocoton: 'Frutales',
        mango: 'Frutales', 'frutos-rojos': 'Frutales',
        cafe: 'Especiales', guanabana: 'Especiales'
    };
    return flavors.map((f, idx) => ({
        id: idx + 1,
        nombre: f.nombre,
        categoria: catOf[f.slug] || 'Frutales',
        precio: 6900,
        precio_1l: 12100,
        descuento: 0,
        stock: 99,
        color_fondo: flavorBgVar(f.slug),
        imagen_url: assetUrl(`assets/products/yoguraso-${f.slug}-500ml-sm.webp`),
        slug: f.slug,
        activo: true
    }));
}

/** Prepara la entrada de un producto con su precio de venta calculado para la ficha flotante. */
export function catalogEntry(p, slug) {
    return {
        ...p,
        slug: slug || matchFlavorSlug(p) || p.slug,
        precio_venta: salePrice(p)
    };
}

/**
 * Registra y actualiza el catálogo activo en `window.YogCatalog` (por slug y por ID)
 * y sincroniza los temas cromáticos de todos los productos con `YogurThemeReactor`.
 */
export function registerCatalog(list) {
    const reg = window.YogCatalog || (window.YogCatalog = { bySlug: {}, byId: {} });
    reg.bySlug = reg.bySlug || {};
    reg.byId = reg.byId || {};

    (list || []).forEach((p) => {
        if (!p) return;
        const isOfficialId = p.id != null && Number(p.id) >= 1 && Number(p.id) <= 8;
        const matched = matchFlavorSlug(p);
        const slug = (isOfficialId && matched) ? matched : (p.slug || matched || '');
        const entry = catalogEntry(p, slug);
        if (slug) reg.bySlug[slug] = entry;
        if (p.id != null) reg.byId[String(p.id)] = entry;
    });

    if (window.YogurThemeReactor?.registerProductThemes) {
        window.YogurThemeReactor.registerProductThemes(list);
    }

    return list;
}

/** Normaliza imágenes, colores y slugs de la lista de productos. */
export function normalizeProducts(list) {
    return (list || []).map((p) => {
        const bottle = bottleUrlFor(p);
        const matched = matchFlavorSlug(p);
        const isOfficialId = p.id != null && Number(p.id) >= 1 && Number(p.id) <= 8;
        const finalSlug = (isOfficialId && matched) ? matched : (p.slug || matched || 'producto');
        const derivedLight = (!customHex(p.color_fondo) && /^#[0-9A-Fa-f]{6}$/.test(String(p.color_dark || '').trim()) && window.YogurThemeReactor?.derivePaletteFromDarkHex)
            ? window.YogurThemeReactor.derivePaletteFromDarkHex(p.color_dark).light
            : null;
        return {
            ...p,
            imagen_url: bottle || p.imagen_url,
            color_fondo: customHex(p.color_fondo)
                || derivedLight
                || (/^[a-z0-9-]+$/.test(String(finalSlug)) ? flavorBgVar(finalSlug) : null)
                || (String(p.color_fondo || '').startsWith('var(--fondo-claro-') ? p.color_fondo : null)
                || p.color_fondo,
            slug: finalSlug
        };
    });
}

/** Lista de productos lista para pintar: Supabase y, si falla, los sabores guardados en el sitio. */
export async function loadCatalogProducts() {
    try {
        const list = await fetchProducts();
        return registerCatalog(Array.isArray(list) && list.length ? normalizeProducts(list) : flavorCatalog());
    } catch {
        return registerCatalog(flavorCatalog());
    }
}
