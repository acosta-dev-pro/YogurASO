/**
 * cart.js — Carrito (localStorage + sidebar + WhatsApp)
 * Guarda items en localStorage, pinta el sidebar y abre WhatsApp al comprar.
 * Estilos: .cart-sidebar en styles.css
 */
(function () {
    const STORAGE_KEY = 'yogur_cart';

    function utils() {
        return window.YogurUtils || {};
    }

    function escapeHtml(v) {
        return utils().escapeHtml ? utils().escapeHtml(v) : String(v ?? '');
    }

    function formatCOP(n) {
        return utils().formatCOP ? utils().formatCOP(n) : `$${Number(n || 0).toLocaleString('es-CO')}`;
    }

    function getConfig() {
        return utils().getConfig ? utils().getConfig() : (window.YOGUR_CONFIG || {});
    }

    function showToast(message, type = 'success') {
        if (utils().showToast) utils().showToast(message, type);
    }

    let carrito = loadCart();

    function loadCart() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(raw) ? raw : [];
        } catch {
            return [];
        }
    }

    function syncFromStorage() {
        carrito = loadCart();
        return carrito;
    }

    function guardarCarrito() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
        window.dispatchEvent(new CustomEvent('yogur:cart-updated'));
    }

    function pulseBadge() {
        const contador = document.getElementById('cart-count');
        const btn = document.getElementById('cartBtn');
        if (contador) {
            contador.classList.remove('badge-bounce');
            void contador.offsetWidth;
            contador.classList.add('badge-bounce');
        }
        if (btn) {
            btn.classList.remove('cart-btn-pulse');
            void btn.offsetWidth;
            btn.classList.add('cart-btn-pulse');
        }
    }

    function updateCounter() {
        syncFromStorage();
        const contador = document.getElementById('cart-count');
        if (!contador) return;
        const totalItems = carrito.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
        contador.textContent = String(totalItems);
        contador.hidden = totalItems === 0;
        contador.setAttribute('aria-label', `${totalItems} productos en el carrito`);
    }

    function getCartTotal(items) {
        return items.reduce((acc, item) => acc + Number(item.precio) * Number(item.cantidad), 0);
    }

    function clampQty(item, cantidad) {
        const next = Number(cantidad);
        if (!Number.isFinite(next) || next <= 0) return 0;
        const stock = Number(item.stock);
        if (Number.isFinite(stock) && stock >= 0) return Math.min(next, stock);
        return next;
    }

    function renderSidebar() {
        const container = document.getElementById('cart-sidebar-items');
        if (!container) return;

        const items = syncFromStorage();
        const clearBtn = document.getElementById('btn-clear-cart-sidebar');
        if (clearBtn) clearBtn.hidden = items.length === 0;

        if (items.length === 0) {
            container.innerHTML = '<div class="cart-empty"><i class="fas fa-cart-shopping" aria-hidden="true"></i> Tu carrito está vacío</div>';
            const totalEl = document.getElementById('cartTotalAmount');
            if (totalEl) totalEl.textContent = '$0';
            return;
        }

        const total = getCartTotal(items);
        container.innerHTML = items.map((item) => `
            <div class="cart-item" data-id="${escapeHtml(item.id)}">
                <div class="cart-item-info">
                    <span class="cart-item-name">${escapeHtml(item.nombre)}</span>
                    <div class="cart-item-controls">
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="-1" aria-label="Disminuir cantidad">-</button>
                        <span class="cart-item-qty" aria-label="Cantidad">${escapeHtml(item.cantidad)}</span>
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="1" aria-label="Aumentar cantidad">+</button>
                        <span class="cart-item-price">${formatCOP(Number(item.precio) * item.cantidad)}</span>
                    </div>
                </div>
                <button type="button" class="cart-remove-btn" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Eliminar ${escapeHtml(item.nombre)}">
                    <i class="fas fa-trash-alt" aria-hidden="true"></i>
                </button>
            </div>
        `).join('');

        const totalEl = document.getElementById('cartTotalAmount');
        if (totalEl) totalEl.textContent = formatCOP(total);
    }

    function setQuantity(id, cantidad) {
        syncFromStorage();
        const idx = carrito.findIndex((i) => String(i.id) === String(id));
        if (idx === -1) return;

        const prev = Number(carrito[idx].cantidad);
        const next = clampQty(carrito[idx], cantidad);
        if (next <= 0) {
            carrito.splice(idx, 1);
            showToast('Producto eliminado', 'info');
        } else {
            if (Number.isFinite(Number(carrito[idx].stock)) && next >= Number(carrito[idx].stock) && cantidad > prev) {
                showToast('Stock máximo alcanzado', 'warning');
            }
            carrito[idx].cantidad = next;
        }

        guardarCarrito();
        updateCounter();
        renderSidebar();
    }

    function changeQuantity(id, delta) {
        syncFromStorage();
        const item = carrito.find((i) => String(i.id) === String(id));
        if (!item) return;
        setQuantity(id, Number(item.cantidad) + Number(delta));
    }

    function removeItem(id) {
        syncFromStorage();
        carrito = carrito.filter((i) => String(i.id) !== String(id));
        guardarCarrito();
        updateCounter();
        renderSidebar();
        showToast('Producto eliminado', 'info');
    }

    function addToCart(producto) {
        if (!producto || producto.id == null) return;

        syncFromStorage();
        const stock = Number(producto.stock);
        const existe = carrito.find((item) => String(item.id) === String(producto.id));

        if (existe) {
            const next = Number(existe.cantidad) + 1;
            if (Number.isFinite(stock) && stock >= 0 && next > stock) {
                showToast('No hay más stock disponible', 'warning');
                return;
            }
            existe.cantidad = next;
            if (Number.isFinite(stock)) existe.stock = stock;
        } else {
            if (Number.isFinite(stock) && stock <= 0) {
                showToast('Producto sin stock', 'error');
                return;
            }
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: Number(producto.precio),
                imagen: producto.imagen_url || producto.imagen || '',
                stock: Number.isFinite(stock) ? stock : null,
                cantidad: 1
            });
        }

        guardarCarrito();
        updateCounter();
        pulseBadge();
        renderSidebar();
        showToast(`${producto.nombre} agregado al carrito`, 'success');
    }

    function getCart() {
        return syncFromStorage().map((item) => ({ ...item }));
    }

    function clearCart() {
        localStorage.removeItem(STORAGE_KEY);
        carrito = [];
        updateCounter();
        renderSidebar();
        window.dispatchEvent(new CustomEvent('yogur:cart-updated'));
    }

    async function clearCartConfirm() {
        const items = syncFromStorage();
        if (!items.length) {
            showToast('Tu carrito ya está vacío', 'info');
            return;
        }

        const ok = utils().confirmAction
            ? await utils().confirmAction({
                title: 'Vaciar carrito',
                message: '¿Estás seguro de vaciar todo el carrito?',
                confirmText: 'Vaciar',
                cancelText: 'Cancelar',
                danger: true
            })
            : window.confirm('¿Vaciar el carrito?');

        if (!ok) return;
        clearCart();
        showToast('Carrito vaciado', 'info');
    }

    function buildWhatsAppMessage(items) {
        const company = getConfig().COMPANY_NAME || 'YogurASO';
        const lineas = items.map((item) => {
            const lineTotal = Number(item.precio) * Number(item.cantidad);
            return `• ${item.nombre} x${item.cantidad} - ${formatCOP(lineTotal)}`;
        });

        const total = getCartTotal(items);
        let usuario = null;
        try {
            usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
        } catch {
            usuario = null;
        }
        const nombre = usuario ? `${usuario.nombre || ''}${usuario.apellido ? ' ' + usuario.apellido : ''}`.trim() : '';

        return [
            'Hola.',
            '',
            `Quiero realizar el siguiente pedido de ${company}.`,
            '',
            'Productos:',
            ...lineas,
            '',
            '---',
            '',
            'Total del pedido:',
            formatCOP(total),
            '',
            `Nombre: ${nombre}`,
            'Teléfono:',
            '',
            'Quedo atento a la confirmación del pedido.'
        ].join('\n');
    }

    function checkoutWhatsApp() {
        const items = syncFromStorage();
        if (items.length === 0) {
            showToast('Tu carrito está vacío', 'warning');
            return;
        }

        const wa = getConfig().WHATSAPP_NUMBER || '573001234567';
        const url = `https://wa.me/${wa}?text=${encodeURIComponent(buildWhatsAppMessage(items))}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    function openSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (!sidebar || !overlay) return;
        renderSidebar();
        sidebar.classList.add('show');
        overlay.classList.add('show');
        sidebar.setAttribute('aria-hidden', 'false');
    }

    function closeSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (!sidebar || !overlay) return;
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        sidebar.setAttribute('aria-hidden', 'true');
    }

    function bindSidebar() {
        const cartBtn = document.getElementById('cartBtn');
        const close = document.getElementById('closeCart');
        const overlay = document.getElementById('cartOverlay');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const sidebarItems = document.getElementById('cart-sidebar-items');
        const clearSidebar = document.getElementById('btn-clear-cart-sidebar');
        const clearPage = document.getElementById('btn-clear-cart');

        if (cartBtn) cartBtn.addEventListener('click', openSidebar);
        if (close) {
            close.addEventListener('click', closeSidebar);
            close.setAttribute('role', 'button');
            close.setAttribute('tabindex', '0');
            close.setAttribute('aria-label', 'Cerrar carrito');
            close.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closeSidebar();
                }
            });
        }
        if (overlay) overlay.addEventListener('click', closeSidebar);
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', checkoutWhatsApp);
            checkoutBtn.innerHTML = '<i class="fab fa-whatsapp" aria-hidden="true"></i> Comprar por WhatsApp';
        }
        if (clearSidebar) clearSidebar.addEventListener('click', clearCartConfirm);
        if (clearPage) clearPage.addEventListener('click', clearCartConfirm);

        if (sidebarItems) {
            sidebarItems.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                const id = btn.dataset.id;
                if (btn.dataset.action === 'qty') changeQuantity(id, Number(btn.dataset.delta));
                else if (btn.dataset.action === 'remove') removeItem(id);
            });
        }
    }

    window.Cart = {
        addToCart,
        updateCounter,
        getCart,
        clearCart,
        clearCartConfirm,
        showToast,
        renderSidebar,
        changeQuantity,
        setQuantity,
        removeItem,
        checkoutWhatsApp,
        getCartTotal,
        openSidebar,
        closeSidebar
    };

    document.addEventListener('DOMContentLoaded', () => {
        updateCounter();
        bindSidebar();
        renderSidebar();
    });
})();
