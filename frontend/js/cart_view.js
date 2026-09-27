/**
 * cart_view.js — Página completa del carrito (carrito.html)
 * Usa window.Cart para cantidades / eliminar / checkout WhatsApp.
 */
document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();

    document.getElementById('btn-checkout')?.addEventListener('click', () => {
        window.Cart?.checkoutWhatsApp();
    });

    window.addEventListener('yogur:cart-updated', renderizarCarrito);
});

function renderizarCarrito() {
    const container = document.getElementById('cart-page-items');
    const carrito = window.Cart?.getCart() || [];
    const escapeHtml = window.YogurUtils?.escapeHtml || ((v) => String(v ?? ''));
    const formatCOP = window.YogurUtils?.formatCOP || ((n) => `$${Number(n || 0).toLocaleString('es-CO')}`);
    const clearBtn = document.getElementById('btn-clear-cart');

    if (!container) return;
    if (clearBtn) clearBtn.hidden = carrito.length === 0;

    if (carrito.length === 0) {
        const href = window.location.pathname.includes('/pages/') ? 'productos.html' : 'pages/productos.html';
        container.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon" aria-hidden="true"><i class="fas fa-shopping-bag"></i></div>
                <p class="cart-empty-title">Tu carrito está vacío</p>
                <p class="cart-empty-text">Aún no agregaste yogures. Explora el catálogo y arma tu pedido fresco para Neiva o Tello.</p>
                <a class="cart-empty-cta" href="${href}">Ver productos</a>
            </div>`;
        actualizarResumen(0);
        document.querySelector('.cart-summary')?.classList.add('is-empty');
        return;
    }
    document.querySelector('.cart-summary')?.classList.remove('is-empty');

    let subtotal = 0;
    const rows = carrito.map((item) => {
        const lineTotal = Number(item.precio) * Number(item.cantidad);
        subtotal += lineTotal;
        const img = item.imagen
            ? `<img class="cart-item-thumb" src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.nombre)}" onerror="this.remove()">`
            : '<span class="shop-bag-ph" aria-hidden="true"><i class="fas fa-cheese"></i></span>';

        return `
            <div class="cart-item shop-bag-row" data-id="${escapeHtml(item.id)}">
                <label class="cart-pick">
                    <input type="checkbox" class="cart-item-check" data-id="${escapeHtml(item.id)}" aria-label="Seleccionar ${escapeHtml(item.nombre)}">
                </label>
                ${img}
                <div class="shop-bag-meta">
                    <span class="cart-item-name">${escapeHtml(item.nombre)}</span>
                    <span class="shop-bag-unit">${formatCOP(item.precio)} c/u</span>
                    <div class="cart-item-controls shop-qty">
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="-1" aria-label="Disminuir">-</button>
                        <span class="cart-item-qty">${escapeHtml(item.cantidad)}</span>
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="1" aria-label="Aumentar">+</button>
                    </div>
                </div>
                <div class="shop-bag-price">
                    <span class="cart-item-price">${formatCOP(lineTotal)}</span>
                    <button type="button" class="cart-remove-btn" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Eliminar">
                        <i class="fas fa-trash-alt" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="cart-select-bar cart-select-bar--page">
            <label class="cart-select-all">
                <input type="checkbox" data-action="toggle-all" aria-label="Seleccionar todos">
                <span>Seleccionar todos</span>
            </label>
            <button type="button" class="cart-remove-selected" data-action="remove-selected" disabled>Eliminar</button>
        </div>
        ${rows}`;

    actualizarResumen(subtotal);

    if (!container.dataset.bound) {
        container.dataset.bound = '1';
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'qty') {
                window.Cart?.changeQuantity(id, Number(btn.dataset.delta));
            } else if (action === 'remove') {
                window.Cart?.removeItemConfirm?.(id);
            } else if (action === 'remove-selected') {
                window.Cart?.removeSelectedConfirm?.(container);
            } else if (action === 'toggle-all') {
                const on = btn.checked;
                container.querySelectorAll('.cart-item-check').forEach((c) => { c.checked = on; });
                window.Cart?.syncSelectToolbar?.(container);
            }
        });
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('cart-item-check') || e.target.dataset.action === 'toggle-all') {
                if (e.target.dataset.action === 'toggle-all') {
                    const on = e.target.checked;
                    container.querySelectorAll('.cart-item-check').forEach((c) => { c.checked = on; });
                }
                window.Cart?.syncSelectToolbar?.(container);
            }
        });
    }
}

function actualizarResumen(subtotal) {
    const formatCOP = window.YogurUtils?.formatCOP || ((n) => `$${Number(n || 0).toLocaleString('es-CO')}`);
    const sub = document.getElementById('subtotal');
    const tot = document.getElementById('total');
    if (sub) sub.textContent = formatCOP(subtotal);
    if (tot) tot.textContent = formatCOP(subtotal);
}
