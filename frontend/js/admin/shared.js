/**
 * admin/shared.js — Ayudas del panel: texto seguro, precios, fechas,
 * sabor de cada producto y sus colores (tokens de css/brand.css).
 */
import { readLocalColors } from './data.js';
import { imgSrc } from './constants.js';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export const cop = (n) => `$${Math.round(Number(n || 0)).toLocaleString('es-CO')}`;

export function salePrice(p) {
    const off = Number(p?.descuento || 0);
    const base = Number(p?.precio || 0);
    return off > 0 ? Math.round(base * (1 - off / 100)) : base;
}

/** Foto de las páginas internas: las rutas del catálogo vienen sin "../". */
export { imgSrc };

const HEX = /^#[0-9a-f]{6}$/i;

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

export const INK = '#2B211D';

export const STATUS_Q = { pending: 'Por revisar', approved: 'Publicada', hidden: 'Oculta' };
export const STATUS_O = {
    pendiente: 'Pendiente', en_proceso: 'En proceso', enviado: 'Enviado', completado: 'Completado', cancelado: 'Cancelado'
};

