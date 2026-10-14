/**
 * main.js — Aquí quedan las tarjetas del catálogo.
 * Pide los yogures a Supabase, filtra y los pinta.
 * El carrusel del inicio está en home-products-carousel.js.
 * La entrada al hacer scroll está en scroll-reveal.js.
 */
import { fetchProducts } from './api.js';
import {
    salePrice,
    bottleUrlFor,
    matchFlavorSlug,
    flavorCatalog,
    registerCatalog,
    normalizeProducts,
    customHex,
    flavorBgVar,
    accentVars
} from './catalogo.js';

export { salePrice, bottleUrlFor, matchFlavorSlug };

const escapeHtml = (v) => window.YogurUtils?.escapeHtml(v) || String(v ?? '');
const formatCOP = (n) => window.YogurUtils?.formatCOP(n) || `$${Number(n || 0).toLocaleString('es-CO')}`;
const toast = (msg, type) => window.YogurUtils?.showToast?.(msg, type);

const SPINNER_HTML = `<span class="spin-ball" aria-hidden="true"></span>`;
const IMG_PLACEHOLDER_HTML = `
    <div class="producto-img-placeholder" role="img" aria-label="Cargando imagen">
        ${SPINNER_HTML}
    </div>
`;

const JAR_SIZES = [
    { id: '1000', label: '1 L', hint: 'Familiar', factor: 3.2 },
    { id: '2000', label: '2 L', hint: 'Mayoreo', factor: 6.4 }
];

function bindProductImageFallbacks(container) {
    container.querySelectorAll('img.producto-img').forEach((img) => {
        img.addEventListener('error', () => {
            const wrap = document.createElement('div');
            wrap.innerHTML = IMG_PLACEHOLDER_HTML.trim();
            img.replaceWith(wrap.firstElementChild);
        }, { once: true });
    });
}

let allProducts = [];
let filters = { q: '', categoria: 'all', sort: 'default' };

/** Aviso de bienvenida solo después de entrar o registrarse. */
function mostrarBienvenidaSiCorresponde() {
    if (sessionStorage.getItem('yogur_just_logged_in') !== '1') return;
    sessionStorage.removeItem('yogur_just_logged_in');
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    toast(`Bienvenido ${usuario?.nombre || 'a YogurASO'}`, 'success');
}

/** Placeholders animados mientras cargan las cards */
function skeletonHtml(count = 6) {
    return Array.from({ length: count }, () => `
        <div class="producto-card producto-skeleton" aria-hidden="true">
            <div class="producto-img-container">
                <div class="producto-img-placeholder">${SPINNER_HTML}</div>
            </div>
            <div class="producto-info">
                <div class="skeleton-line skeleton-pulse"></div>
                <div class="skeleton-line short skeleton-pulse"></div>
            </div>
        </div>
    `).join('');
}

function badgeHtml(p, sinStock) {
    const bits = [];
    let label = String(p.letrero || '').trim();
    let kind = String(p.letrero_tipo || '').trim() || 'nuevo';
    const off = Number(p.descuento || 0);
    if (!label && off > 0) {
        label = `-${Math.round(off)}%`;
        kind = 'descuento';
    }
    if (label) {
        bits.push(`<span class="producto-badge badge-${escapeHtml(kind)}">${escapeHtml(label)}</span>`);
    }
    if (sinStock) bits.push('<span class="producto-badge badge-stock">Sin stock</span>');
    return bits.join('');
}

/** Aplica búsqueda, categoría y orden (todo en el navegador, sin pedir otra vez a la base) */
function getFilteredProducts() {
    let list = [...allProducts];
    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const q = norm(filters.q.trim());

    if (q) {
        list = list.filter((p) =>
            norm(p.nombre).includes(q) ||
            norm(p.descripcion).includes(q) ||
            norm(p.categoria).includes(q) ||
            norm(p.sabor).includes(q) ||
            norm(p.slug).includes(q)
        );
    }

    if (filters.categoria !== 'all') {
        const want = String(filters.categoria);
        list = list.filter((p) => {
            const cat = String(p.categoria || '');
            if (cat === want) return true;
            const slug = matchFlavorSlug(p) || p.slug || '';
            const groups = {
                Frutales: ['fresa','pina','mora','melocoton','mango','frutos-rojos'],
                'Clásicos': ['fresa','pina','mora','melocoton'],
                Especiales: ['cafe','guanabana']
            };
            if (groups[want]) return groups[want].includes(String(slug));
            return false;
        });
    }

    switch (filters.sort) {
        case 'price-asc':
            list.sort((a, b) => Number(a.precio) - Number(b.precio));
            break;
        case 'price-desc':
            list.sort((a, b) => Number(b.precio) - Number(a.precio));
            break;
        case 'name-asc':
            list.sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
            break;
        default:
            list.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return list;
}

function fillCategoryOptions(products) {
    const select = document.getElementById('filtro-categoria');
    const chips = document.getElementById('catalog-chips');
    const cats = [...new Set(products.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

    if (select) {
        const current = select.value || 'all';
        select.innerHTML = `<option value="all">Todas las categorías</option>` +
            cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        select.value = cats.includes(current) ? current : 'all';
    }

    if (chips) {
        const active = filters.categoria || 'all';
        const preset = [
            { id: 'all', label: 'Todos' },
            { id: 'Frutales', label: 'Frutales' },
            { id: 'Clásicos', label: 'Clásicos' },
            { id: 'Especiales', label: 'Especiales' }
        ];
        // Always show mockup filter set (Todos/Frutales/Clásicos/Especiales)
        const list = preset;
        chips.innerHTML = list.map((c) => {
            const on = active === c.id ? 'is-on' : '';
            return `<button type="button" class="chip ${on}" data-cat="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>`;
        }).join('');
        if (!chips.dataset.bound) {
            chips.dataset.bound = '1';
            chips.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-cat]');
                if (!btn) return;
                filters.categoria = btn.dataset.cat;
                if (select) select.value = filters.categoria;
                chips.querySelectorAll('.chip').forEach((el) => el.classList.toggle('is-on', el.dataset.cat === filters.categoria));
                renderProducts();
            });
        }
    }
}

function bindAddButtons(container) {
    if (container.dataset.boundAdd) return;
    container.dataset.boundAdd = '1';
    container.addEventListener('click', (e) => {
        const hpCard = e.target.closest('.hp-card');
        if (hpCard && !hpCard.classList.contains('producto-skeleton')) {
            const hpQty = e.target.closest('[data-hp-qty]');
            if (hpQty) {
                e.preventDefault();
                e.stopPropagation();
                const val = hpCard.querySelector('[data-hp-qty-val]');
                if (!val) return;
                const next = Math.max(1, (Number(val.textContent) || 1) + Number(hpQty.dataset.hpQty));
                val.textContent = String(next);
                return;
            }
            const fav = e.target.closest('[data-hp-fav]');
            if (fav) {
                e.preventDefault();
                e.stopPropagation();
                const on = fav.getAttribute('aria-pressed') === 'true';
                fav.setAttribute('aria-pressed', on ? 'false' : 'true');
                fav.classList.toggle('is-on', !on);
                return;
            }
            const hpAdd = e.target.closest('[data-hp-add]');
            if (hpAdd) {
                e.preventDefault();
                e.stopPropagation();
                const p = allProducts.find((x) => String(x.id) === String(hpCard.dataset.id));
                const qty = Number(hpCard.querySelector('[data-hp-qty-val]')?.textContent) || 1;
                if (window.Cart && p && !hpAdd.disabled) {
                    window.Cart.addToCart({
                        id: p.id,
                        lineId: `${p.id}::500`,
                        nombre: p.nombre,
                        tamano: '500 ml',
                        precio: Number(salePrice(p)) || Number(p.precio) || 0,
                        imagen_url: bottleUrlFor(p),
                        stock: p.stock,
                        cantidad: qty
                    });
                }
                return;
            }
            // Clic en cualquier parte de la tarjeta (fuera de botones) abre la ficha flotante.
            const slug = hpCard.dataset.slug;
            if (slug && window.YogFicha?.open && !e.target.closest('button, input, select, textarea')) {
                const p = allProducts.find((x) => String(x.id) === String(hpCard.dataset.id));
                const opener = hpCard.querySelector('.hp-card__name [data-hp-open]') || hpCard;
                if (window.YogFicha.open(slug, opener, p ? catalogEntry(p, slug) : null) !== false) {
                    e.preventDefault();
                    return;
                }
            }
        }
        const qtyBtn = e.target.closest('[data-qty]');
        if (qtyBtn) {
            e.preventDefault();
            e.stopPropagation();
            const wrap = qtyBtn.closest('[data-qty-wrap]');
            const val = wrap?.querySelector('[data-qty-val]');
            if (!val) return;
            const next = Math.max(1, (Number(val.textContent) || 1) + Number(qtyBtn.dataset.qty));
            val.textContent = String(next);
            return;
        }
        if (e.target.closest('[data-wish]')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('[data-wish]');
            const icon = btn.querySelector('i');
            const on = icon?.classList.contains('fas');
            if (icon) {
                icon.classList.toggle('fas', !on);
                icon.classList.toggle('far', on);
            }
            return;
        }
        const addBtn = e.target.closest('.btn-add');
        const card = e.target.closest('.producto-card');
        if (!card || card.classList.contains('producto-skeleton')) return;
        if (!addBtn && e.target.closest('[data-ficha], .btn-ficha')) return;
        e.preventDefault();
        const p = allProducts.find((x) => String(x.id) === String(card.dataset.id));
        const qty = Number(card.querySelector('[data-qty-val]')?.textContent) || 1;
        if (addBtn && window.Cart && p) {
            window.Cart.addToCart({
                id: p.id,
                lineId: `${p.id}::500`,
                nombre: p.nombre,
                tamano: '500 ml',
                precio: Number(salePrice(p)) || Number(p.precio) || 0,
                imagen_url: bottleUrlFor(p),
                stock: p.stock,
                cantidad: qty
            });
            return;
        }
        if (!addBtn && card.dataset.slug && window.YogFicha) {
            window.YogFicha.open(card.dataset.slug, card);
            return;
        }
        if (addBtn) openInspect(card.dataset.id);
    });
}

/** Carrusel viejo del inicio. Solo corre si existe #home-rail-track (hoy el inicio usa otro). */
function setupHomeRail() {
    const view = document.getElementById('home-rail-track');
    const row = document.getElementById('productos-container');
    if (!view || !row?.classList.contains('productos-grid-horizontal')) return;

    if (view._stopRail) view._stopRail();

    const cards = [...row.querySelectorAll('.producto-card')];
    if (!cards.length) return;

    row.append(...cards.map((c) => c.cloneNode(true)));
    bindProductImageFallbacks(row);
    row.style.willChange = 'transform';

    const cycle = () => {
        const w = cards.reduce((n, c) => n + c.offsetWidth, 0) + 14 * cards.length;
        return w || 1;
    };

    const state = { x: 0, paused: false, raf: 0 };

    const apply = () => {
        const w = cycle();
        while (state.x <= -w) state.x += w;
        while (state.x > 0) state.x -= w;
        row.style.transform = `translateX(${state.x}px)`;
    };

    const tick = () => {
        if (!state.paused) {
            state.x -= 0.55;
            apply();
        }
        state.raf = requestAnimationFrame(tick);
    };

    const go = (dir) => {
        const card = row.querySelector('.producto-card');
        state.x += dir * ((card?.offsetWidth || 188) + 14);
        apply();
    };

    view._stopRail = () => cancelAnimationFrame(state.raf);
    tick();

    if (!view.dataset.boundRail) {
        view.dataset.boundRail = '1';
        document.getElementById('rail-prev')?.addEventListener('click', () => view._go?.(-1));
        document.getElementById('rail-next')?.addEventListener('click', () => view._go?.(1));
        view.addEventListener('mouseenter', () => { if (view._rail) view._rail.paused = true; });
        view.addEventListener('mouseleave', () => { if (view._rail) view._rail.paused = false; });
    }
    view._rail = state;
    view._go = go;
}

function prettyDescription(p) {
    const base = String(p.descripcion || '').trim();
    if (base) return base;
    return 'Sin descripción. El administrador puede agregarla desde el panel.';
}

function roundPrice(n) {
    return Math.max(500, Math.round(Number(n) / 100) * 100);
}

function ensureInspectModal() {
    if (document.getElementById('inspectOverlay')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
        <div class="inspect-overlay" id="inspectOverlay" hidden>
            <div class="inspect-modal" role="dialog" aria-modal="true" aria-labelledby="inspect-title">
                <button type="button" class="inspect-close" id="inspectClose" aria-label="Cerrar">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
                <div class="inspect-media" id="inspectMedia"></div>
                <div class="inspect-body">
                    <p class="inspect-kicker" id="inspectCat"></p>
                    <h2 id="inspect-title"></h2>
                    <p class="inspect-desc" id="inspectDesc"></p>
                    <p class="inspect-size-label">Tamaño del tarro</p>
                    <div class="inspect-sizes" id="inspectSizes"></div>
                    <div class="inspect-row">
                        <div class="inspect-qty" id="inspectQty">
                            <button type="button" data-d="-1" aria-label="Menos">−</button>
                            <span id="inspectQtyVal">1</span>
                            <button type="button" data-d="1" aria-label="Más">+</button>
                        </div>
                        <div class="inspect-pricebox">
                            <span class="inspect-unit" id="inspectUnit"></span>
                            <strong id="inspectTotal"></strong>
                        </div>
                    </div>
                    <button type="button" class="inspect-add" id="inspectAdd">Agregar a la bolsa</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(wrap.firstElementChild);

    const overlay = document.getElementById('inspectOverlay');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeInspect();
    });
    document.getElementById('inspectClose').addEventListener('click', closeInspect);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.hidden) closeInspect();
    });
    document.getElementById('inspectQty').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-d]');
        if (!btn || !inspectState.product) return;
        inspectState.qty = Math.max(1, inspectState.qty + Number(btn.dataset.d));
        refreshInspectPrice();
    });
    document.getElementById('inspectSizes').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-size]');
        if (!btn || !inspectState.product) return;
        inspectState.sizeId = btn.dataset.size;
        refreshInspectPrice();
    });
    document.getElementById('inspectAdd').addEventListener('click', () => {
        const p = inspectState.product;
        if (!p) return;
        const size = JAR_SIZES.find((s) => s.id === inspectState.sizeId) || JAR_SIZES[0];
        window.Cart?.addToCart({
            id: p.id,
            lineId: `${p.id}::${size.id}`,
            nombre: p.nombre,
            tamano: size.label,
            precio: roundPrice(salePrice(p) * size.factor),
            imagen_url: p.imagen_url || '',
            stock: p.stock,
            cantidad: inspectState.qty
        });
        closeInspect();
    });
}

const inspectState = { product: null, sizeId: '1000', qty: 1 };

function refreshInspectPrice() {
    const p = inspectState.product;
    if (!p) return;
    const size = JAR_SIZES.find((s) => s.id === inspectState.sizeId) || JAR_SIZES[0];
    const unit = roundPrice(salePrice(p) * size.factor);
    document.getElementById('inspectQtyVal').textContent = String(inspectState.qty);
    document.getElementById('inspectUnit').textContent = `${formatCOP(unit)} c/u`;
    document.getElementById('inspectTotal').textContent = formatCOP(unit * inspectState.qty);
    document.querySelectorAll('#inspectSizes .size-chip').forEach((el) => {
        el.classList.toggle('is-on', el.dataset.size === inspectState.sizeId);
    });
}

function openInspect(id) {
    const p = allProducts.find((x) => String(x.id) === String(id));
    if (!p || Number(p.stock) <= 0) {
        if (p && Number(p.stock) <= 0) toast('Producto sin stock', 'warning');
        return;
    }
    ensureInspectModal();
    inspectState.product = p;
    inspectState.sizeId = '1000';
    inspectState.qty = 1;

    document.getElementById('inspectCat').textContent = p.categoria || 'Yogur artesanal';
    document.getElementById('inspect-title').textContent = p.nombre;
    document.getElementById('inspectDesc').textContent = prettyDescription(p);
    const media = document.getElementById('inspectMedia');
    const hasImg = Boolean(String(p.imagen_url || '').trim());
    media.innerHTML = hasImg
        ? `<img src="${escapeHtml(p.imagen_url)}" alt="${escapeHtml(p.nombre)}" class="inspect-img">`
        : IMG_PLACEHOLDER_HTML;
    if (hasImg) bindProductImageFallbacks(media);

    document.getElementById('inspectSizes').innerHTML = JAR_SIZES.map((s) => `
        <button type="button" class="size-chip ${s.id === inspectState.sizeId ? 'is-on' : ''}" data-size="${s.id}">
            <strong>${s.label}</strong>
            <span>${s.hint}</span>
        </button>
    `).join('');
    refreshInspectPrice();

    const overlay = document.getElementById('inspectOverlay');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeInspect() {
    const overlay = document.getElementById('inspectOverlay');
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
    inspectState.product = null;
}


/**
 * AQUÍ SE ARMAN Y SE PINTAN LAS CARDS DE PRODUCTO
 * Cada card: imagen, badges (Nuevo / Sin stock), nombre, precio, botón Agregar.
 */
function renderProducts() {
    const container = document.getElementById('productos-container');
    if (!container) return;
    const isHomeMasonry = Boolean(container.classList.contains('productos-masonry'));

    let products = getFilteredProducts();
    if (!products.length && (isHomeMasonry || !document.getElementById('catalog-search'))) {
        allProducts = flavorCatalog();
        filters = { q: '', categoria: 'all', sort: 'default' };
        products = getFilteredProducts();
    }

    const countEl = document.getElementById('catalog-count');
    if (countEl) {
        countEl.textContent = products.length === 1
            ? '1 producto'
            : `${products.length} productos`;
    }

    if (!products.length) {
        container.innerHTML = `
            <div class="catalog-empty">
                <i class="fas fa-search" aria-hidden="true"></i>
                <p>No encontramos productos con esos filtros.</p>
                <button type="button" class="btn-primary" id="btn-reset-filters">Limpiar filtros</button>
            </div>
        `;
        document.getElementById('btn-reset-filters')?.addEventListener('click', resetFilters);
        return;
    }

    const useHpCards = document.body.classList.contains('productos-page-v3');
    const HP_HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-7.3-4.4-9.2-9A5.2 5.2 0 0 1 12 6.1a5.2 5.2 0 0 1 9.2 5.2c-1.9 4.6-9.2 9-9.2 9Z"/></svg>';

    const hpCardHtml = (p, index) => {
        const sinStock = Number(p.stock) <= 0;
        const slug = matchFlavorSlug(p) || p.slug || '';
        const safe = /^[a-z0-9-]+$/.test(String(slug)) ? slug : '';
        const wash = customHex(p.color_fondo) || (safe ? flavorBgVar(safe) : 'var(--fondo-claro-fresa, #F4CBCF)');
        const ink = 'color-mix(in srgb, var(--hp-c) 42%, #171717)';
        const name = escapeHtml(p.nombre);
        const bottle = bottleUrlFor(p);
        const img = bottle
            ? `<img src="${escapeHtml(bottle)}" alt="Yogur ${name}, botella de 500 ml" width="320" height="555" decoding="async" draggable="false">`
            : '';
        const askPrice = !Number(p.precio);
        const venta = salePrice(p);
        const price = askPrice
            ? '<span class="hp-price yg-price is-ask">Consultar</span>'
            : (Number(p.descuento) > 0
                ? `<span class="hp-price yg-price"><s>${formatCOP(p.precio)}</s> ${formatCOP(venta)}</span>`
                : `<span class="hp-price yg-price">${formatCOP(venta)}</span>`);
        let label = String(p.letrero || '').trim();
        const off = Number(p.descuento || 0);
        if (!label && off > 0) label = `-${Math.round(off)}%`;
        const badges = [];
        if (label) badges.push(`<span class="hp-badge">${escapeHtml(label)}</span>`);
        if (sinStock) badges.push('<span class="hp-badge hp-badge--out">Sin stock</span>');
        const badgeBlock = badges.length ? `<div class="hp-card__badges">${badges.join('')}</div>` : '';
        const addLabel = sinStock ? 'Sin stock' : (askPrice ? 'Pedir' : 'Agregar');
        const addAria = sinStock ? `${name} sin stock` : `Agregar ${name} al carrito`;
        const featured = index === 0 ? ' is-active' : '';
        const catalogHref = window.location.pathname.includes('/pages/') ? 'productos.html' : 'pages/productos.html';
        return `
            <article class="hp-card${sinStock ? ' is-out' : ''}${featured}" data-id="${escapeHtml(p.id)}" data-slug="${escapeHtml(slug)}" data-tone="light" style="--hp-c:${wash};--hp-ink:${ink};--producto-card-bg:${wash};${accentVars(p)}">
                <span class="hp-card__panel" aria-hidden="true"></span>
                <a class="hp-card__media" href="${catalogHref}" data-hp-open tabindex="-1" aria-hidden="true">
                    <span class="hp-card__floor"></span>
                    ${img}
                </a>
                ${badgeBlock}
                <button type="button" class="hp-fav" data-hp-fav aria-pressed="false" aria-label="Guardar ${name} en favoritos">${HP_HEART}</button>
                <div class="hp-card__body">
                    <h3 class="hp-card__name"><a href="${catalogHref}" data-hp-open aria-label="Ver ficha de ${name}">${name}</a></h3>
                    <p class="hp-card__meta">500 ml · ${escapeHtml(p.categoria || 'Yogurt Artesanal')}</p>
                    <p class="hp-card__price">${price}</p>
                    <div class="hp-card__actions">
                        <div class="hp-qty" role="group" aria-label="Cantidad de ${name}">
                            <button type="button" data-hp-qty="-1" aria-label="Quitar uno">&minus;</button>
                            <span data-hp-qty-val>1</span>
                            <button type="button" data-hp-qty="1" aria-label="Sumar uno">+</button>
                        </div>
                        <button type="button" class="hp-add" data-hp-add ${sinStock ? 'disabled' : ''} aria-label="${addAria}">${addLabel}</button>
                    </div>
                </div>
            </article>
        `;
    };

    const cardHtml = (p, index) => {
        const sinStock = Number(p.stock) <= 0;
        const venta = salePrice(p);
        const slug = matchFlavorSlug(p) || p.slug || '';
        const bottle = bottleUrlFor(p);
        const tieneImagen = Boolean(String(bottle || '').trim());
        const mediaHtml = tieneImagen
            ? `<img src="${escapeHtml(bottle)}" alt="${escapeHtml(p.nombre)}" class="producto-img" loading="lazy" decoding="async" width="320" height="555">`
            : IMG_PLACEHOLDER_HTML;

        const stored = String(p.color_fondo || '');
        const wash = customHex(stored)
            || (/^[a-z0-9-]+$/.test(slug) ? flavorBgVar(slug) : null)
            || (stored.startsWith('var(--fondo-claro-') ? stored : null)
            || 'var(--cream, #FFF8F4)';
        const askPrice = !Number(p.precio);
        const precioHtml = askPrice
            ? `<span class="precio is-ask">Consultar</span>`
            : (p.descuento > 0
                ? `<span class="precio"><s class="precio-antes">${formatCOP(p.precio)}</s> ${formatCOP(venta)}</span>`
                : `<span class="precio" aria-label="Precio">${formatCOP(venta)}</span>`);

        const addLabel = sinStock
            ? 'Sin stock'
            : (askPrice
                ? '<i class="fas fa-shopping-cart" aria-hidden="true"></i> Pedir'
                : '<i class="fas fa-shopping-cart" aria-hidden="true"></i> Agregar al carrito');

        return `
            <article class="producto-card card-v3 ${sinStock ? 'is-out-of-stock' : ''}" data-id="${escapeHtml(p.id)}" data-slug="${escapeHtml(slug)}" style="--producto-card-bg:${wash};${accentVars(p)}animation-delay:${Math.min(index * 0.06, 0.48)}s">
                <div class="producto-img-container">
                    ${badgeHtml(p, sinStock)}
                    <button type="button" class="wish-btn" aria-label="Favorito" data-wish="${escapeHtml(p.id)}"><i class="fas fa-heart" aria-hidden="true"></i></button>
                    ${mediaHtml}
                </div>
                <div class="producto-info">
                    <h3>${escapeHtml(p.nombre)}</h3>
                    <p class="producto-categoria">500 ml · ${escapeHtml(p.categoria || 'Yogurt Artesanal')}</p>
                    <div class="producto-footer">
                        <div class="qty-row">
                            ${precioHtml}
                            <div class="qty" data-qty-wrap>
                                <button type="button" data-qty="-1" aria-label="Menos">−</button>
                                <span data-qty-val>1</span>
                                <button type="button" data-qty="1" aria-label="Más">+</button>
                            </div>
                        </div>
                        <button type="button"
                                class="btn-add"
                                ${sinStock ? 'disabled' : ''}
                                data-id="${escapeHtml(p.id)}"
                                data-nombre="${escapeHtml(p.nombre)}"
                                data-precio="${escapeHtml(p.precio)}"
                                data-imagen="${escapeHtml(bottle || '')}"
                                data-stock="${escapeHtml(p.stock)}"
                                data-ficha="${escapeHtml(slug)}"
                                aria-label="${sinStock ? 'Sin stock' : `Agregar ${escapeHtml(p.nombre)} al carrito`}">
                            ${addLabel}
                        </button>
                    </div>
                </div>
                        </article>
        `;
    };

    container.innerHTML = products.map((p, index) => (useHpCards ? hpCardHtml(p, index) : cardHtml(p, index))).join('');
    delete container.dataset.cloned;
    bindProductImageFallbacks(container);
    bindAddButtons(container);

    container.querySelectorAll('[data-ficha]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const slug = btn.getAttribute('data-ficha');
            if (slug && window.YogFicha) window.YogFicha.open(slug, btn);
        });
    });
    setupHomeRail();
}

function resetFilters() {
    filters = { q: '', categoria: 'all', sort: 'default' };
    const search = document.getElementById('catalog-search');
    const cat = document.getElementById('filtro-categoria');
    const sort = document.getElementById('filtro-orden');
    if (search) search.value = '';
    if (cat) cat.value = 'all';
    if (sort) sort.value = 'default';
    document.querySelectorAll('#catalog-chips .chip').forEach((el) => {
        el.classList.toggle('is-on', el.dataset.cat === 'all');
    });
    renderProducts();
}

function setupCatalogControls() {
    const search = document.getElementById('catalog-search');
    const cat = document.getElementById('filtro-categoria');
    const sort = document.getElementById('filtro-orden');

    search?.addEventListener('input', () => {
        filters.q = search.value;
        renderProducts();
    });
    cat?.addEventListener('change', () => {
        filters.categoria = cat.value;
        renderProducts();
    });
    sort?.addEventListener('change', () => {
        filters.sort = sort.value;
        renderProducts();
    });
}

/**
 * Lista de productos lista para pintar, sin tocar el DOM.
 * La usa el carrusel del home (js/home-products-carousel.js).
 * Misma fuente y mismo respaldo local que cargarProductos().
 */
export async function loadCatalogProducts() {
    try {
        const list = await fetchProducts();
        return registerCatalog(Array.isArray(list) && list.length ? normalizeProducts(list) : flavorCatalog());
    } catch {
        return registerCatalog(flavorCatalog());
    }
}

/** Carga productos desde Supabase y dibuja las cards */
async function cargarProductos() {
    const container = document.getElementById('productos-container');
    if (!container) return;

    container.innerHTML = skeletonHtml(6);
    setupCatalogControls();

    try {
        allProducts = await fetchProducts();
        if (!Array.isArray(allProducts) || !allProducts.length) {
            allProducts = flavorCatalog();
        } else {
            allProducts = normalizeProducts(allProducts);
        }
        registerCatalog(allProducts);
        fillCategoryOptions(allProducts);
        renderProducts();
    } catch {
        allProducts = registerCatalog(flavorCatalog());
        if (allProducts.length) {
            fillCategoryOptions(allProducts);
            renderProducts();
            return;
        }
        container.innerHTML = '<p class="catalog-error">Error al cargar productos. Revisa tu conexión y recarga.</p>';
        toast('Error al cargar productos', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    mostrarBienvenidaSiCorresponde();
    cargarProductos();
    window.Cart?.updateCounter();
});
