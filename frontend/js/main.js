/**
 * main.js — Catálogo y cards de productos (frontend / diseño dinámico)
 * ------------------------------------------------------------------
 * Aquí se manejan las CARDS de yogurt:
 *  1. Se piden productos a la API (api.js)
 *  2. Se filtran / buscan / ordenan en el navegador
 *  3. Se pintan como HTML con la clase .producto-card
 *
 * Contenedor HTML: #productos-container (index.html y productos.html)
 * Estilos CSS:     .producto-card en styles.css
 */
import { fetchProducts } from './api.js';

const escapeHtml = (v) => window.YogurUtils?.escapeHtml(v) || String(v ?? '');
const formatCOP = (n) => window.YogurUtils?.formatCOP(n) || `$${Number(n || 0).toLocaleString('es-CO')}`;
const toast = (msg, type) => window.YogurUtils?.showToast?.(msg, type);

/** Imagen por defecto si el producto no tiene foto */
const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f3e9df' width='300' height='200'/%3E%3Ctext x='150' y='105' text-anchor='middle' fill='%23a67c52' font-family='sans-serif' font-size='18'%3EYogurASO%3C/text%3E%3C/svg%3E";

let allProducts = [];
let filters = { q: '', categoria: 'all', sort: 'default' };

/** Animaciones al hacer scroll (beneficios, nosotros, etc.) */
function aplicarAnimacionesEntrada() {
    const revealItems = document.querySelectorAll('.beneficio-card, .nosotros-content, .nosotros-images, .section-title');
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
            <div class="skeleton-img skeleton-pulse"></div>
            <div class="producto-info">
                <div class="skeleton-line skeleton-pulse"></div>
                <div class="skeleton-line short skeleton-pulse"></div>
                <div class="skeleton-line tiny skeleton-pulse"></div>
            </div>
        </div>
    `).join('');
}

function getNewestIds(products) {
    return [...products]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 2)
        .map((p) => p.id);
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
    if (!select) return;

    const cats = [...new Set(products.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    const current = select.value || 'all';
    select.innerHTML = `<option value="all">Todas las categorías</option>` +
        cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    select.value = cats.includes(current) ? current : 'all';
}

/**
 * AQUÍ SE ARMAN Y SE PINTAN LAS CARDS DE PRODUCTO
 * Cada card: imagen, badges (Nuevo / Sin stock), nombre, precio, botón Agregar.
 */
function renderProducts() {
    const container = document.getElementById('productos-container');
    if (!container) return;

    const products = getFilteredProducts();
    const newest = new Set(getNewestIds(allProducts));
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

    container.innerHTML = products.map((p, index) => {
        const sinStock = Number(p.stock) <= 0;
        const esNuevo = newest.has(p.id);
        const img = escapeHtml(p.imagen_url || PLACEHOLDER_IMG);

        return `
            <article class="producto-card ${sinStock ? 'is-out-of-stock' : ''}" style="animation-delay:${Math.min(index * 0.05, 0.4)}s">
                <div class="producto-img-container">
                    ${esNuevo ? '<span class="producto-badge badge-nuevo">Nuevo</span>' : ''}
                    ${sinStock ? '<span class="producto-badge badge-stock">Sin stock</span>' : ''}
                    <img src="${img}"
                         alt="${escapeHtml(p.nombre)}"
                         class="producto-img"
                         loading="lazy"
                         onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
                </div>
                <div class="producto-info">
                    <div class="producto-name-row">
                        <h3>${escapeHtml(p.nombre)}</h3>
                    </div>
                    <p class="producto-categoria">${escapeHtml(p.categoria || 'Yogur')}</p>
                    <p class="descripcion">${escapeHtml(p.descripcion || '')}</p>
                    <div class="producto-footer">
                        <span class="precio" aria-label="Precio">${formatCOP(p.precio)}</span>
                        <button type="button"
                                class="btn-add"
                                ${sinStock ? 'disabled' : ''}
                                data-id="${escapeHtml(p.id)}"
                                data-nombre="${escapeHtml(p.nombre)}"
                                data-precio="${escapeHtml(p.precio)}"
                                data-imagen="${escapeHtml(p.imagen_url || '')}"
                                data-stock="${escapeHtml(p.stock)}"
                                aria-label="${sinStock ? 'Sin stock' : `Agregar ${escapeHtml(p.nombre)} al carrito`}">
                            ${sinStock ? 'Sin stock' : '<i class="fas fa-plus" aria-hidden="true"></i> Agregar'}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Eventos del botón "Agregar" → cart.js
    container.querySelectorAll('.btn-add').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (btn.disabled) return;
            btn.classList.add('btn-add-pop');
            setTimeout(() => btn.classList.remove('btn-add-pop'), 350);
            const stock = btn.dataset.stock !== '' ? Number(btn.dataset.stock) : null;
            window.Cart?.addToCart({
                id: btn.dataset.id,
                nombre: btn.dataset.nombre,
                precio: parseFloat(btn.dataset.precio),
                imagen_url: btn.dataset.imagen || '',
                stock
            });
        });
    });
}

function resetFilters() {
    filters = { q: '', categoria: 'all', sort: 'default' };
    const search = document.getElementById('catalog-search');
    const cat = document.getElementById('filtro-categoria');
    const sort = document.getElementById('filtro-orden');
    if (search) search.value = '';
    if (cat) cat.value = 'all';
    if (sort) sort.value = 'default';
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
        fillCategoryOptions(allProducts);
        renderProducts();
    } catch {
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
