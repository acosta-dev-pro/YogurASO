/**
 * main.js — Catálogo y cards de productos (frontend / diseño dinámico)
 * ------------------------------------------------------------------
 * Aquí se manejan las CARDS de yogurt:
 *  1. Se piden productos a la API (api.js)
 *  2. Se filtran / buscan / ordenan en el navegador
 *  3. Se pintan como HTML con la clase .producto-card
 *
 * Contenedor HTML: #productos-container (index.html y productos.html)
 * Estilos de la card: css/cards-productos.css (el grid está en shop-ui.css)
 */
import { fetchProducts } from './api.js';

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

/** Animaciones al hacer scroll (beneficios, nosotros, etc.) */
function aplicarAnimacionesEntrada() {
    const revealItems = document.querySelectorAll('.beneficio-card, .pastel-card, .nosotros-content, .nosotros-visual, .ns-process-card, .section-title, .productos-masonry .producto-card');
    if (!revealItems.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16 });

    revealItems.forEach((el) => {
        el.classList.add('reveal-start');
        observer.observe(el);
    });
}

/** Toast de bienvenida solo después de login/registro */
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

function salePrice(p) {
    const base = Number(p.precio || 0);
    const off = Number(p.descuento || 0);
    if (!off) return base;
    return Math.max(500, Math.round((base * (1 - off / 100)) / 100) * 100);
}

/** Aplica búsqueda, categoría y orden (todo en frontend, sin backend) */
function getFilteredProducts() {
    let list = [...allProducts];
    const q = filters.q.trim().toLowerCase();

    if (q) {
        list = list.filter((p) =>
            String(p.nombre || '').toLowerCase().includes(q) ||
            String(p.descripcion || '').toLowerCase().includes(q) ||
            String(p.categoria || '').toLowerCase().includes(q)
        );
    }

    if (filters.categoria !== 'all') {
        list = list.filter((p) => String(p.categoria || '') === filters.categoria);
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
        chips.innerHTML = ['all', ...cats].map((c) => {
            const label = c === 'all' ? 'Todos' : c;
            const on = active === c ? 'is-on' : '';
            return `<button type="button" class="chip ${on}" data-cat="${escapeHtml(c)}">${escapeHtml(label)}</button>`;
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
        if (e.target.closest('[data-ficha], .btn-ficha')) return;
        const addBtn = e.target.closest('.btn-add');
        const card = e.target.closest('.producto-card');
        if (!card || card.classList.contains('producto-skeleton')) return;
        e.preventDefault();
        const p = allProducts.find((x) => String(x.id) === String(card.dataset.id));
        if (p?.local_only || String(card.dataset.id || '').startsWith('local-')) {
            const slug = card.dataset.slug || matchFlavorSlug(p || {}) || '';
            if (addBtn && window.Cart && p) {
                window.Cart.addToCart({
                    id: p.id,
                    lineId: `${p.id}::500`,
                    nombre: p.nombre,
                    tamano: '500 ml',
                    precio: Number(p.precio) || 0,
                    imagen_url: bottleUrlFor(p),
                    stock: p.stock,
                    cantidad: 1
                });
                return;
            }
            if (slug && window.YogFicha) {
                window.YogFicha.open(slug, card);
                return;
            }
        }
        if (addBtn || !container.classList.contains('productos-masonry')) {
            openInspect(card.dataset.id);
        } else if (card.dataset.slug && window.YogFicha) {
            window.YogFicha.open(card.dataset.slug, card);
        } else {
            openInspect(card.dataset.id);
        }
    });
}

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


/** Sabores locales (botellas) cuando el backend no trae productos o la imagen es vieja. */
const FLAVOR_WASH = {
    fresa: '#FFE6EA', pina: '#FFF4CC', mora: '#F3E0EE', melocoton: '#FFE6D6',
    'frutos-rojos': '#FFE0E8', cafe: '#F0E6DF', guanabana: '#E7F4E2', mango: '#FFE9CF'
};

function flavorCatalog() {
    const flavors = window.YOGUR_FLAVORS || [];
    return flavors.map((f, i) => ({
        id: `local-${f.slug}`,
        nombre: `Yogurt ${f.nombre}`,
        categoria: 'Yogurt artesanal · 500 ml',
        precio: 0,
        descuento: 0,
        stock: 99,
        color_fondo: FLAVOR_WASH[f.slug] || '#FFF8F4',
        imagen_url: `assets/products/yoguraso-${f.slug}-500ml-sm.webp`,
        slug: f.slug,
        local_only: true
    }));
}

function matchFlavorSlug(p) {
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

function bottleUrlFor(p) {
    const slug = matchFlavorSlug(p);
    if (slug) return `assets/products/yoguraso-${slug}-500ml-sm.webp`;
    const url = String(p.imagen_url || '');
    if (/yoguraso-[\w-]+-500ml/i.test(url)) return url;
    return url;
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

    const cardHtml = (p, index) => {
        const sinStock = Number(p.stock) <= 0;
        const venta = salePrice(p);
        const slug = matchFlavorSlug(p) || p.slug || '';
        const bottle = bottleUrlFor(p);
        const tieneImagen = Boolean(String(bottle || '').trim());
        const mediaHtml = tieneImagen
            ? `<img src="${escapeHtml(bottle)}" alt="${escapeHtml(p.nombre)}" class="producto-img" loading="lazy" decoding="async" width="320" height="555">`
            : IMG_PLACEHOLDER_HTML;

        const wash = FLAVOR_WASH[slug] || (/^#[0-9A-Fa-f]{6}$/.test(p.color_fondo || '') ? p.color_fondo : '#FFF8F4');
        const askPrice = p.local_only || !Number(p.precio);
        const precioHtml = askPrice
            ? `<span class="precio is-ask">Consultar</span>`
            : (p.descuento > 0
                ? `<span class="precio"><s class="precio-antes">${formatCOP(p.precio)}</s> ${formatCOP(venta)}</span>`
                : `<span class="precio" aria-label="Precio">${formatCOP(venta)}</span>`);

        const fichaBtn = (isHomeMasonry && slug)
            ? `<button type="button" class="btn-ficha" data-ficha="${escapeHtml(slug)}" aria-label="Ver ficha de ${escapeHtml(p.nombre)}">Ver ficha</button>`
            : '';
        const addLabel = sinStock ? 'Sin stock' : (askPrice ? 'Pedir' : '<i class="fas fa-plus" aria-hidden="true"></i> Agregar');

        return `
            <article class="producto-card ${sinStock ? 'is-out-of-stock' : ''}" data-id="${escapeHtml(p.id)}" data-slug="${escapeHtml(slug)}" style="--producto-card-bg:${wash};animation-delay:${Math.min(index * 0.06, 0.48)}s">
                <div class="producto-img-container">
                    ${badgeHtml(p, sinStock)}
                    ${mediaHtml}
                </div>
                <div class="producto-info">
                    <div class="producto-name-row">
                        <h3>${escapeHtml(p.nombre)}</h3>
                    </div>
                    <p class="producto-categoria">${escapeHtml(p.categoria || 'Yogurt artesanal')}</p>
                    <div class="producto-footer">
                        ${precioHtml}
                        <div class="pin-actions">
                            ${fichaBtn}
                            <button type="button"
                                    class="btn-add"
                                    ${sinStock ? 'disabled' : ''}
                                    data-id="${escapeHtml(p.id)}"
                                    data-nombre="${escapeHtml(p.nombre)}"
                                    data-precio="${escapeHtml(p.precio)}"
                                    data-imagen="${escapeHtml(bottle || '')}"
                                    data-stock="${escapeHtml(p.stock)}"
                                    aria-label="${sinStock ? 'Sin stock' : `Pedir ${escapeHtml(p.nombre)}`}">
                                ${addLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    };

    container.innerHTML = products.map((p, index) => cardHtml(p, index)).join('');
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

/** Carga productos desde el backend y dibuja las cards */
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
            // Preferir botella recortada si el nombre/sabor coincide
            allProducts = allProducts.map((p) => {
                const bottle = bottleUrlFor(p);
                const slug = matchFlavorSlug(p);
                return {
                    ...p,
                    imagen_url: bottle || p.imagen_url,
                    color_fondo: p.color_fondo || FLAVOR_WASH[slug] || p.color_fondo,
                    slug: p.slug || slug
                };
            });
        }
        fillCategoryOptions(allProducts);
        renderProducts();
    } catch {
        allProducts = flavorCatalog();
        if (allProducts.length) {
            fillCategoryOptions(allProducts);
            renderProducts();
            return;
        }
        container.innerHTML = '<p class="catalog-error">Error al cargar productos. ¿El backend está corriendo?</p>';
        toast('Error al cargar productos', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarAnimacionesEntrada();
    mostrarBienvenidaSiCorresponde();
    cargarProductos();
    window.Cart?.updateCounter();
});
