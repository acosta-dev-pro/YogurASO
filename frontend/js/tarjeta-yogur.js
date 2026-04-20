/**
 * tarjeta-yogur.js — La tarjeta de yogur (.hp-card): su HTML y lo que hacen sus botones.
 * La usan el carrusel del inicio (home-products-carousel.js) y la cuadrícula del catálogo (main.js).
 * Estilos: css/home-products.css
 */
import { salePrice, priceForSize, basePriceForSize, bottleUrlFor, matchFlavorSlug, customHex } from './catalogo.js';

export const escapeHtml = (v) => window.YogurUtils?.escapeHtml?.(v)
    ?? String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const formatCOP = (n) => window.YogurUtils?.formatCOP?.(n) || `$${Number(n || 0).toLocaleString('es-CO')}`;

const PRODUCT_PAGE = 'pages/productos.html';
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.3-4.4-9.2-9A5.2 5.2 0 0 1 12 6.1a5.2 5.2 0 0 1 9.2 5.2c-1.9 4.6-9.2 9-9.2 9Z"/></svg>';

/** Color pastel del fondo de la tarjeta: el elegido en el panel, el derivado del color fuerte o el del sabor. */
function panelColor(p, slug) {
    const reactor = window.YogurThemeReactor;
    const dark = String(p.color_dark || '').trim();
    const derived = !customHex(p.color_fondo) && /^#[0-9A-Fa-f]{6}$/.test(dark) && reactor?.derivePaletteFromDarkHex
        ? reactor.derivePaletteFromDarkHex(dark).light : null;
    const safe = /^[a-z0-9-]+$/.test(slug) ? slug : '';
    return customHex(p.color_fondo) || derived || reactor?.triads?.[slug]?.light || (safe ? `var(--fondo-claro-${safe})` : 'var(--fondo-claro-fresa, #F4CBCF)');
}

function badgeHtml(p, sinStock) {
    const chips = [];
    const off = Number(p.descuento || 0);
    const label = String(p.letrero || '').trim() || (off > 0 ? `-${Math.round(off)}%` : '');
    if (label) {
        const isOff = off > 0 || label.includes('%');
        const isNew = label.toUpperCase().includes('NUEVO');
        const bg = p.color_acento || (isOff ? '#D62300' : (isNew ? '#2A9D60' : 'rgba(255, 255, 255, 0.95)'));
        const fg = isOff || isNew ? '#FFFFFF' : '#151515';
        chips.push(`<span class="hp-chip" style="--chip-bg:${bg};--chip-fg:${fg};">${escapeHtml(label)}</span>`);
    }
    if (sinStock) chips.push('<span class="hp-chip hp-chip--out">Sin stock</span>');
    return chips.length ? `<div class="hp-card__chips">${chips.join('')}</div>` : '';
}

/** Precio con descuento (tachado + final) para la presentación elegida. */
function priceHtml(p, size = '500 ml') {
    if (!Number(p.precio)) return '<span class="hp-price yg-price is-ask">Consultar</span>';
    if (Number(p.descuento) > 0) return `<span class="hp-price yg-price"><s>${formatCOP(basePriceForSize(p, size))}</s> ${formatCOP(priceForSize(p, size))}</span>`;
    return `<span class="hp-price yg-price">${formatCOP(priceForSize(p, size))}</span>`;
}

/** HTML de una tarjeta. i = posición, n = total, isClone = copia decorativa del carrusel infinito. */
export function cardHtml(p, i, n, isClone = false) {
    const slug = matchFlavorSlug(p) || p.slug || '';
    const name = escapeHtml(p.nombre);
    const sinStock = Number(p.stock) <= 0;
    const askPrice = !Number(p.precio);
    const bottle = bottleUrlFor(p);
    const img = bottle ? `<img src="${escapeHtml(bottle)}" alt="${isClone ? '' : `Yogur ${name}, botella de 500 ml`}" width="320" height="555" decoding="async" draggable="false">` : '';
    const addLabel = sinStock ? 'Sin stock' : (askPrice ? 'Pedir' : 'Añadir');
    const addAria = sinStock ? `${name} sin stock` : `Añadir ${name} al carrito`;
    const aria = isClone ? 'aria-hidden="true" data-clone' : `role="group" aria-roledescription="producto" aria-label="${name}, ${i + 1} de ${n}"`;
    return `
<article class="hp-card${sinStock ? ' is-out' : ''}" data-i="${i}" data-id="${escapeHtml(p.id)}" data-slug="${escapeHtml(slug)}" data-tone="light"
    style="--hp-c:${panelColor(p, slug)};--hp-ink:color-mix(in srgb, var(--hp-c) 42%, #171717)" ${aria}>
    <span class="hp-card__panel" aria-hidden="true"></span>
    <a class="hp-card__media" href="${PRODUCT_PAGE}" data-hp-open tabindex="-1" aria-hidden="true">
        <span class="hp-card__floor"></span>
        ${img}
    </a>
    ${badgeHtml(p, sinStock)}
    <div class="hp-card__body">
        <button type="button" class="hp-fav" data-hp-fav aria-pressed="false" aria-label="Guardar ${name} en favoritos">${HEART}</button>
        <div class="hp-card__header">
            <span class="hp-card__cat">${escapeHtml(p.categoria || 'Yogurt Artesanal')}</span>
            <h3 class="hp-card__name"><a href="${PRODUCT_PAGE}" data-hp-open aria-label="Ver ficha de ${name}">${name}</a></h3>
            <span class="yg-size-selector" data-card-sizes role="radiogroup" aria-label="Presentación">
                <button type="button" class="yg-size-btn is-active" data-size="500 ml">500 ml</button>
                <button type="button" class="yg-size-btn" data-size="1 Litro">1 L</button>
            </span>
        </div>
        <div class="hp-card__meta"><p class="hp-card__price">${priceHtml(p)}</p></div>
        <div class="hp-card__actions">
            <div class="hp-qty" role="group" aria-label="Cantidad de ${name}">
                <button type="button" data-hp-qty="-1" aria-label="Quitar uno">&minus;</button>
                <span data-hp-qty-val>1</span>
                <button type="button" data-hp-qty="1" aria-label="Sumar uno">+</button>
            </div>
            <button type="button" class="hp-add" data-hp-add ${sinStock ? 'disabled' : ''} aria-label="${addAria}">
                <svg class="hp-add__ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.2v9.6M3.2 8h9.6"/></svg>
                <span>${addLabel}</span>
            </button>
        </div>
    </div>
</article>`;
}

/**
 * Botones de las tarjetas dentro de `root`: presentación (500 ml / 1 L), cantidad, favorito, añadir y abrir la ficha.
 * `find(id)` devuelve el producto. Las copias de una misma tarjeta (carrusel infinito) se mantienen iguales.
 */
export function bindCardActions(root, find) {
    const same = (id) => [...root.querySelectorAll('.hp-card')].filter((c) => c.dataset.id === id);

    root.addEventListener('click', (e) => {
        const card = e.target.closest('.hp-card');
        const p = card && find(card.dataset.id);
        if (!p) return;
        const id = card.dataset.id;

        const sz = e.target.closest('.yg-size-btn');
        if (sz) {
            e.preventDefault();
            e.stopPropagation();
            const chosen = sz.dataset.size || '500 ml';
            same(id).forEach((c) => {
                c.dataset.selectedSize = chosen;
                c.querySelectorAll('.yg-size-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.size === chosen));
                const el = c.querySelector('.hp-card__price');
                if (el && Number(p.precio)) el.innerHTML = priceHtml(p, chosen);
            });
            return;
        }

        const q = e.target.closest('[data-hp-qty]');
        if (q) {
            const max = Number(p.stock) > 0 ? Number(p.stock) : 99;
            const want = (Number(card.querySelector('[data-hp-qty-val]')?.textContent) || 1) + Number(q.dataset.hpQty);
            if (want > max) window.YogurUtils?.showToast?.(`Solo hay ${max} unidades disponibles de ${p.nombre}`, 'warning');
            const next = Math.min(max, Math.max(1, want));
            same(id).forEach((c) => { c.querySelector('[data-hp-qty-val]').textContent = String(next); });
            return;
        }

        if (e.target.closest('[data-hp-fav]')) {
            const on = card.querySelector('[data-hp-fav]').getAttribute('aria-pressed') !== 'true';
            same(id).forEach((c) => {
                const b = c.querySelector('[data-hp-fav]');
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
                b.classList.toggle('is-on', on);
            });
            return;
        }

        if (e.target.closest('[data-hp-add]')) {
            if (!window.Cart?.addToCart) return;
            const chosen = card.dataset.selectedSize || '500 ml';
            window.Cart.addToCart({
                id: p.id,
                lineId: `${p.id}::${chosen === '1 Litro' ? '1000' : '500'}`,
                nombre: p.nombre,
                tamano: chosen,
                precio: Number(priceForSize(p, chosen)) || Number(p.precio) || 0,
                imagen_url: bottleUrlFor(p),
                stock: p.stock,
                cantidad: Number(card.querySelector('[data-hp-qty-val]')?.textContent) || 1
            });
            return;
        }

        // Cualquier otra parte de la tarjeta abre la ficha
        if (!e.target.closest('button, input, select, textarea, .yg-size-selector') && window.YogFicha?.open) {
            e.preventDefault();
            const chosen = card.dataset.selectedSize || '500 ml';
            const slug = card.dataset.slug || 'fresa';
            window.YogFicha.open(slug, card.querySelector('.hp-card__name [data-hp-open]') || card, { ...p, slug, selectedSize: chosen, precio_venta: salePrice(p) });
        }
    });
}
