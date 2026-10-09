/**
 * admin/shared.js — Ayudas del panel: texto seguro, precios, fechas,
 * sabor de cada producto y sus colores (tokens de css/brand.css).
 */
import { readLocalColors } from './data.js';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export const cop = (n) => `$${Math.round(Number(n || 0)).toLocaleString('es-CO')}`;

export function salePrice(p) {
    const off = Number(p?.descuento || 0);
    const base = Number(p?.precio || 0);
    return off > 0 ? Math.round(base * (1 - off / 100)) : base;
}

const dateFmt = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota'
});
export function fmtDate(iso) {
    const d = new Date(iso || '');
    return Number.isNaN(d.getTime()) ? '' : dateFmt.format(d);
}

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Mismo criterio que main.js: slug del sabor si el nombre lo menciona. */
export function flavorOf(p) {
    const flavors = window.YOGUR_FLAVORS || [];
    const slug = String(p?.slug || p?.sabor || '').toLowerCase();
    if (slug && flavors.some((f) => f.slug === slug)) return slug;
    const name = norm(p?.nombre);
    for (const f of flavors) {
        if (name.includes(norm(f.nombre)) || name.includes(f.slug.replace(/-/g, ' ')) || name.includes(f.slug)) return f.slug;
    }
    return '';
}

/** Foto de las páginas internas: las rutas del catálogo vienen sin "../". */
export function imgSrc(url) {
    const s = String(url || '');
    if (!s || /^(https?:|data:|blob:|\/|\.\.\/)/i.test(s)) return s;
    return `../${s.replace(/^\.\//, '')}`;
}

/** La tienda prefiere la botella recortada del sabor; el panel muestra lo mismo. */
export function photoFor(p) {
    const slug = flavorOf(p);
    if (slug) return `../assets/products/yoguraso-${slug}-500ml-sm.webp`;
    return imgSrc(p?.imagen_url);
}

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v) => HEX.test(String(v || ''));

function cssVar(name) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return isHex(v) ? v.toUpperCase() : '';
}

export const DEFAULT_FONDO = '#FFF8F4';
export const DEFAULT_FUERTE = '#C3343E';

/** Colores de marca del sabor (brand.css): pastel --fondo-claro-*, fuerte --bg-*. */
export function brandColors(p) {
    const slug = flavorOf(p);
    return {
        fondo: (slug && cssVar(`--fondo-claro-${slug}`)) || DEFAULT_FONDO,
        fuerte: (slug && cssVar(`--bg-${slug}`)) || cssVar('--rojo-marca') || DEFAULT_FUERTE
    };
}

/**
 * Colores con los que se pinta el producto:
 * 1) lo guardado en la base (background_color / accent_color),
 * 2) el respaldo de este navegador para el fuerte,
 * 3) los de marca del sabor.
 * background_color = #FFF8F4 es el valor por defecto de la tabla: se toma como "sin elegir".
 */
export function colorsFor(p) {
    const brand = brandColors(p);
    const local = readLocalColors()[String(p?.id)] || {};
    const dbFondo = isHex(p?.color_fondo) && p.color_fondo.toUpperCase() !== DEFAULT_FONDO ? p.color_fondo.toUpperCase() : '';
    const dbFuerte = isHex(p?.color_acento) ? p.color_acento.toUpperCase() : '';
    const localFuerte = isHex(local.fuerte) ? local.fuerte.toUpperCase() : '';
    return {
        fondo: dbFondo || brand.fondo,
        fuerte: dbFuerte || localFuerte || brand.fuerte,
        fondoOrigen: dbFondo ? 'base' : 'marca',
        fuerteOrigen: dbFuerte ? 'base' : (localFuerte ? 'navegador' : 'marca'),
        brand
    };
}

function lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrast(a, b) {
    const la = lum(a);
    const lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const INK = '#2B211D';
/** Tinta legible sobre un color: blanco u oscuro, el que contraste más. */
export function inkOn(hex) {
    if (!isHex(hex)) return '#FFFFFF';
    return contrast(hex, '#FFFFFF') >= contrast(hex, INK) ? '#FFFFFF' : INK;
}

export const STATUS_Q = { pending: 'Por revisar', approved: 'Publicada', hidden: 'Oculta' };
export const STATUS_O = {
    pendiente: 'Pendiente', en_proceso: 'En proceso', enviado: 'Enviado', completado: 'Completado', cancelado: 'Cancelado'
};

export function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}
