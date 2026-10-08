/**
 * home-products-carousel.js — "Nuestros yogures" del home.
 * ------------------------------------------------------------------
 * Carrusel de una sola fila, infinito, con scroll-snap centrado.
 *  - Los productos vienen de main.js (misma API y mismo respaldo local).
 *  - El loop: se pintan varias copias de la lista y, cuando el scroll
 *    termina fuera de la copia del medio, se salta en silencio a la
 *    misma tarjeta de la copia del medio (mismo contenido, sin salto visible).
 *  - La tarjeta centrada recibe .is-active (panel de color del sabor).
 *  - Carrito: window.Cart.addToCart (cart.js). Ficha: window.YogFicha (ficha.js).
 *  - No intercepta la rueda vertical: el scroll de la página sigue normal.
 * Estilos: css/home-products.css
 */
import { loadCatalogProducts, salePrice, bottleUrlFor, matchFlavorSlug } from './main.js';

const root = document.querySelector('[data-hp-carousel]');
const track = root?.querySelector('.hp-track');

const escapeHtml = (v) => window.YogurUtils?.escapeHtml?.(v)
    ?? String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const formatCOP = (n) => window.YogurUtils?.formatCOP?.(n) || `$${Number(n || 0).toLocaleString('es-CO')}`;

const PRODUCT_PAGE = 'pages/productos.html';
const FALLBACK_COLOR = '#E51D2A'; // --brand-red
const AUTO_MS = 5600;
const IDLE_AFTER_TOUCH_MS = 9000;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- color helpers (usa el color "dot" de flavors.js) ---------- */
function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance([r, g, b]) {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const toHex = (rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

/** Color del sabor + tono de texto sobre el panel + tinta legible sobre blanco. */
function flavorTheme(slug) {
    const flavor = (window.YOGUR_FLAVORS || []).find((f) => f.slug === slug);
    const color = hexToRgb(flavor?.dot) ? flavor.dot : FALLBACK_COLOR;
    const rgb = hexToRgb(color);
    const tone = luminance(rgb) > 0.4 ? 'light' : 'dark';
    let ink = rgb;
    for (let i = 0; i < 12 && contrast(luminance(ink), 1) < 4.6; i += 1) {
        ink = ink.map((c) => c * 0.88);
    }
    return { color, tone, ink: toHex(ink) };
}

/* ---------- markup ---------- */
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.3-4.4-9.2-9A5.2 5.2 0 0 1 12 6.1a5.2 5.2 0 0 1 9.2 5.2c-1.9 4.6-9.2 9-9.2 9Z"/></svg>';

function badgeHtml(p, sinStock) {
    const bits = [];
    let label = String(p.letrero || '').trim();
    const off = Number(p.descuento || 0);
    if (!label && off > 0) label = `-${Math.round(off)}%`;
    if (label) bits.push(`<span class="hp-badge">${escapeHtml(label)}</span>`);
    if (sinStock) bits.push('<span class="hp-badge hp-badge--out">Sin stock</span>');
    return bits.length ? `<div class="hp-card__badges">${bits.join('')}</div>` : '';
}

function priceHtml(p) {
    if (!Number(p.precio)) return '<span class="hp-price is-ask">Consultar</span>';
    const venta = salePrice(p);
    if (Number(p.descuento) > 0) {
        return `<span class="hp-price"><s>${formatCOP(p.precio)}</s> ${formatCOP(venta)}</span>`;
    }
    return `<span class="hp-price">${formatCOP(venta)}</span>`;
}

function cardHtml(p, i, n, isClone) {
    const slug = matchFlavorSlug(p) || p.slug || '';
    const t = flavorTheme(slug);
    const name = escapeHtml(p.nombre);
    const sinStock = Number(p.stock) <= 0;
    const askPrice = !Number(p.precio);
    const bottle = bottleUrlFor(p);
    const img = bottle
        ? `<img src="${escapeHtml(bottle)}" alt="${isClone ? '' : `Yogur ${name}, botella de 500 ml`}" width="320" height="555" decoding="async" draggable="false">`
        : '';
    const addLabel = sinStock ? 'Sin stock' : (askPrice ? 'Pedir' : 'Agregar');
    const addAria = sinStock ? `${name} sin stock` : `Agregar ${name} al carrito`;
    return `
<article class="hp-card${sinStock ? ' is-out' : ''}" data-i="${i}" data-id="${escapeHtml(p.id)}" data-slug="${escapeHtml(slug)}" data-tone="${t.tone}"
    style="--hp-c:${t.color};--hp-ink:${t.ink}" ${isClone ? 'aria-hidden="true" data-clone' : `role="group" aria-roledescription="producto" aria-label="${name}, ${i + 1} de ${n}"`}>
    <span class="hp-card__panel" aria-hidden="true"></span>
    <a class="hp-card__media" href="${PRODUCT_PAGE}" data-hp-open tabindex="-1" aria-hidden="true">
        <span class="hp-card__floor"></span>
        ${img}
    </a>
    ${badgeHtml(p, sinStock)}
    <button type="button" class="hp-fav" data-hp-fav aria-pressed="false" aria-label="Guardar ${name} en favoritos">${HEART}</button>
    <div class="hp-card__body">
        <h3 class="hp-card__name"><a href="${PRODUCT_PAGE}" data-hp-open aria-label="Ver ficha de ${name}">${name}</a></h3>
        <p class="hp-card__meta">500 ml · ${escapeHtml(p.categoria || 'Yogurt Artesanal')}</p>
        <p class="hp-card__price">${priceHtml(p)}</p>
        <div class="hp-card__actions">
            <div class="hp-qty" role="group" aria-label="Cantidad de ${name}">
                <button type="button" data-hp-qty="-1" aria-label="Quitar uno">&minus;</button>
                <span data-hp-qty-val>1</span>
                <button type="button" data-hp-qty="1" aria-label="Sumar uno">+</button>
            </div>
            <button type="button" class="hp-add" data-hp-add ${sinStock ? 'disabled' : ''} aria-label="${addAria}">${addLabel}</button>
        </div>
    </div>
</article>`;
}

/* ---------- carrusel ---------- */
function initCarousel(products) {
    const n = products.length;
    const prevBtn = root.querySelector('[data-hp-prev]');
    const nextBtn = root.querySelector('[data-hp-next]');
    const live = root.querySelector('[data-hp-live]');
    const qty = new Map();
    const favs = new Set();

    let reps = n > 1 ? 3 : 1;
    let mid = Math.floor(reps / 2);
    let cards = [];
    let m = { first: 0, step: 1, w: 1 };
    let active = -1;
    let targetIdx = null;
    let touching = false;
    let drag = null;
    let suppressClick = false;
    let lastUserAt = 0;
    let hovering = false;
    let inView = false;

    root.classList.toggle('is-single', n < 2);

    function render() {
        let html = '';
        for (let r = 0; r < reps; r += 1) {
            html += products.map((p, i) => cardHtml(p, i, n, r !== mid)).join('');
        }
        track.innerHTML = html;
        cards = [...track.querySelectorAll('.hp-card')];
        track.querySelectorAll('.hp-card[data-clone] a, .hp-card[data-clone] button').forEach((el) => {
            el.setAttribute('tabindex', '-1');
        });
        // reaplica estado compartido (cantidad / favorito) a todas las copias
        qty.forEach((v, id) => syncQty(id, v));
        favs.forEach((id) => syncFav(id, true));
        active = -1;
    }

    function measure() {
        if (!cards.length) return;
        const a = cards[0];
        const b = cards[1] || a;
        m = {
            first: a.offsetLeft,
            w: a.offsetWidth,
            step: (b.offsetLeft - a.offsetLeft) || a.offsetWidth || 1
        };
    }

    /** Copias necesarias para que un gesto largo no llegue al borde real. */
    function neededReps() {
        if (n < 2) return 1;
        const setW = n * m.step;
        const side = Math.max(1, Math.ceil((track.clientWidth * 2) / setW));
        return Math.min(2 * side + 1, 41);
    }

    const total = () => cards.length;
    const leftFor = (idx) => m.first + idx * m.step + m.w / 2 - track.clientWidth / 2;
    function centerIndex() {
        const c = track.scrollLeft + track.clientWidth / 2;
        const idx = Math.round((c - m.first - m.w / 2) / m.step);
        return Math.max(0, Math.min(total() - 1, idx));
    }

    function setActive(logical) {
        if (logical === active) return;
        active = logical;
        cards.forEach((c) => c.classList.toggle('is-active', Number(c.dataset.i) === logical));
    }

    function scrollToIndex(idx, smooth) {
        track.scrollTo({ left: leftFor(idx), behavior: smooth && !reduceMotion.matches ? 'smooth' : 'auto' });
    }

    /** Lleva el scroll a la copia del medio sin cambio visible. */
    function normalize() {
        if (n < 2 || touching || drag) return;
        const idx = centerIndex();
        const copy = Math.floor(idx / n);
        if (copy !== mid) track.scrollLeft += (mid - copy) * n * m.step;
    }

    function announce(logical) {
        if (live) live.textContent = `${products[logical].nombre}, ${logical + 1} de ${n}`;
    }

    function go(dir, user = true) {
        if (n < 2) return;
        let base = targetIdx ?? centerIndex();
        const copy = Math.floor(base / n);
        if (copy !== mid) {
            const shift = (mid - copy) * n;
            track.scrollLeft += shift * m.step;
            base += shift;
        }
        targetIdx = base + dir;
        scrollToIndex(targetIdx, true);
        if (user) {
            lastUserAt = Date.now();
            announce(((targetIdx % n) + n) % n);
        }
    }

    /* scroll: resaltar la centrada; al terminar, normalizar */
    let raf = 0;
    let settleTimer = 0;
    const hasScrollEnd = 'onscrollend' in window;
    function onSettle() {
        targetIdx = null;
        normalize();
        setActive(centerIndex() % n);
    }
    track.addEventListener('scroll', () => {
        if (!raf) {
            raf = requestAnimationFrame(() => {
                raf = 0;
                setActive(centerIndex() % n);
            });
        }
        if (!hasScrollEnd) {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(onSettle, 160);
        }
    }, { passive: true });
    if (hasScrollEnd) track.addEventListener('scrollend', onSettle);

    /* táctil: no normalizar con el dedo encima */
    track.addEventListener('touchstart', () => { touching = true; lastUserAt = Date.now(); }, { passive: true });
    const touchEnd = () => {
        touching = false;
        lastUserAt = Date.now();
        if (!hasScrollEnd) { clearTimeout(settleTimer); settleTimer = setTimeout(onSettle, 220); }
    };
    track.addEventListener('touchend', touchEnd, { passive: true });
    track.addEventListener('touchcancel', touchEnd, { passive: true });

    /* arrastre con mouse (en touch/trackpad el scroll es nativo) */
    track.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0 || n < 2) return;
        drag = { x: e.clientX, left: track.scrollLeft, moved: false, id: e.pointerId };
    });
    window.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x;
        if (!drag.moved) {
            if (Math.abs(dx) < 6) return;
            drag.moved = true;
            track.classList.add('is-dragging');
            try { track.setPointerCapture(drag.id); } catch { /* noop */ }
        }
        track.scrollLeft = drag.left - dx;
    });
    const endDrag = () => {
        if (!drag) return;
        const moved = drag.moved;
        try { track.releasePointerCapture(drag.id); } catch { /* noop */ }
        drag = null;
        if (!moved) return;
        lastUserAt = Date.now();
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 60);
        const idx = centerIndex();
        scrollToIndex(idx, true);
        // reactivar snap cuando termine el desplazamiento suave
        const restore = () => { track.classList.remove('is-dragging'); onSettle(); };
        if (hasScrollEnd) track.addEventListener('scrollend', restore, { once: true });
        setTimeout(restore, reduceMotion.matches ? 0 : 650);
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    track.addEventListener('click', (e) => {
        if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
    }, true);
    track.addEventListener('dragstart', (e) => e.preventDefault());

    /* flechas + teclado */
    prevBtn?.addEventListener('click', () => go(-1));
    nextBtn?.addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            go(e.key === 'ArrowLeft' ? -1 : 1);
        }
    });
    /* al tabular dentro de una tarjeta, centrarla */
    track.addEventListener('focusin', (e) => {
        const card = e.target.closest?.('.hp-card');
        if (!card) return;
        const idx = cards.indexOf(card);
        if (idx >= 0 && idx !== centerIndex()) scrollToIndex(idx, true);
    });

    /* acciones de la tarjeta */
    function syncQty(id, v) {
        cards.forEach((c) => {
            if (c.dataset.id === id) {
                const el = c.querySelector('[data-hp-qty-val]');
                if (el) el.textContent = String(v);
            }
        });
    }
    function syncFav(id, on) {
        cards.forEach((c) => {
            if (c.dataset.id !== id) return;
            const b = c.querySelector('[data-hp-fav]');
            b?.setAttribute('aria-pressed', on ? 'true' : 'false');
            b?.classList.toggle('is-on', on);
        });
    }
    track.addEventListener('click', (e) => {
        const card = e.target.closest('.hp-card');
        if (!card) return;
        const id = card.dataset.id;
        const p = products.find((x) => String(x.id) === id);
        if (!p) return;

        const q = e.target.closest('[data-hp-qty]');
        if (q) {
            const next = Math.max(1, (qty.get(id) || 1) + Number(q.dataset.hpQty));
            qty.set(id, next);
            syncQty(id, next);
            return;
        }
        if (e.target.closest('[data-hp-fav]')) {
            const on = !favs.has(id);
            if (on) favs.add(id); else favs.delete(id);
            syncFav(id, on);
            return;
        }
        if (e.target.closest('[data-hp-add]')) {
            if (!window.Cart?.addToCart) return;
            window.Cart.addToCart({
                id: p.id,
                lineId: `${p.id}::500`,
                nombre: p.nombre,
                tamano: '500 ml',
                precio: Number(salePrice(p)) || Number(p.precio) || 0,
                imagen_url: bottleUrlFor(p),
                stock: p.stock,
                cantidad: qty.get(id) || 1
            });
            return;
        }
        const open = e.target.closest('[data-hp-open]');
        if (open) {
            const slug = card.dataset.slug;
            const isFlavor = (window.YOGUR_FLAVORS || []).some((f) => f.slug === slug);
            if (slug && isFlavor && window.YogFicha?.open) {
                e.preventDefault();
                window.YogFicha.open(slug, open);
            }
            // si no hay ficha para ese producto, el enlace sigue a productos.html
        }
    });

    /* auto-avance suave (opcional): se pausa con hover, foco, toque o arrastre */
    function canAuto() {
        return n > 1 && inView && !hovering && !touching && !drag && !document.hidden
            && !reduceMotion.matches && !root.contains(document.activeElement)
            && Date.now() - lastUserAt > IDLE_AFTER_TOUCH_MS
            && !document.querySelector('dialog[open]');
    }
    setInterval(() => { if (canAuto()) go(1, false); }, AUTO_MS);
    root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
    root.addEventListener('pointerleave', () => { hovering = false; });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: 0.5 }).observe(track);
    }

    /* layout inicial + resize */
    function layout(logical) {
        measure();
        const need = neededReps();
        if (need !== reps) {
            reps = need;
            mid = Math.floor(reps / 2);
            render();
            measure();
        }
        scrollToIndex(mid * n + logical, false);
        setActive(logical);
    }

    render();
    layout(0);

    let resizeTimer = 0;
    let lastW = track.clientWidth;
    new ResizeObserver(() => {
        if (track.clientWidth === lastW) return;
        lastW = track.clientWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => layout(active < 0 ? 0 : active), 120);
    }).observe(track);

    root.classList.add('is-ready');
}

async function boot() {
    if (!root || !track) return;
    let products = [];
    try {
        products = await loadCatalogProducts();
    } catch {
        products = [];
    }
    if (!products.length) {
        track.innerHTML = '<p class="hp-status">Pronto tendremos nuevos sabores aquí.</p>';
        root.classList.add('is-single');
        return;
    }
    initCarousel(products);
}

boot();
