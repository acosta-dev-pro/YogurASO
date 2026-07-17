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
        container.innerHTML = '<p class="empty-cart"><i class="fas fa-shopping-bag" aria-hidden="true"></i>Tu carrito está vacío. <a href="productos.html">Ver productos</a></p>';
        actualizarResumen(0);
        return;
    }

    let subtotal = 0;
    container.innerHTML = carrito.map((item) => {
        const lineTotal = Number(item.precio) * Number(item.cantidad);
        subtotal += lineTotal;
        const img = item.imagen
            ? `<img class="cart-item-thumb" src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.nombre)}" onerror="this.style.display='none'">`
            : '';

        return `
            <div class="cart-item" data-id="${escapeHtml(item.id)}">
                ${img}
                <div class="cart-item-info">
                    <span class="cart-item-name">${escapeHtml(item.nombre)}</span>
                    <div class="cart-item-controls">
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="-1" aria-label="Disminuir">-</button>
                        <span class="cart-item-qty">${escapeHtml(item.cantidad)}</span>
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="1" aria-label="Aumentar">+</button>
                        <span class="cart-item-price">${formatCOP(lineTotal)}</span>
                    </div>
                </div>
                <button type="button" class="cart-remove-btn" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Eliminar">
                    <i class="fas fa-trash-alt" aria-hidden="true"></i>
                </button>
            </div>
        `;
    }).join('');

    actualizarResumen(subtotal);

    if (!container.dataset.bound) {
        container.dataset.bound = '1';
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const id = btn.dataset.id;
            if (btn.dataset.action === 'qty') {
                window.Cart?.changeQuantity(id, Number(btn.dataset.delta));
            } else if (btn.dataset.action === 'remove') {
                window.Cart?.removeItem(id);
            }
        });
    }
}

function actualizarResumen(subtotal) {
    const formatCOP = window.YogurUtils?.formatCOP || ((n) => `$${Number(n || 0).toLocaleString('es-CO')}`);
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    if (subtotalEl) subtotalEl.textContent = formatCOP(subtotal);
    if (totalEl) totalEl.textContent = formatCOP(subtotal);
}
