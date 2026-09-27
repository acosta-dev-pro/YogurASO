/**
 * cart.js — Carrito
 * Los items se guardan en localStorage (clave yogur_cart).
 * El botón de compra arma un texto y abre WhatsApp; el servidor no guarda el pedido.
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

    function sanitizeCartItem(item) {
        if (!item || item.id == null) return null;
        const cantidad = Number(item.cantidad);
        const precio = Number(item.precio);
        if (!Number.isFinite(cantidad) || cantidad <= 0) return null;
        if (!Number.isFinite(precio) || precio < 0) return null;
        return {
            id: item.id,
            nombre: String(item.nombre || 'Producto'),
            precio,
            cantidad,
            imagen: item.imagen || item.imagen_url || '',
            stock: Number.isFinite(Number(item.stock)) ? Number(item.stock) : null,
            tamano: item.tamano || item.presentacion || ''
        };
    }

    function loadCart() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const raw = JSON.parse(stored);
            if (!Array.isArray(raw)) {
                localStorage.removeItem(STORAGE_KEY);
                return [];
            }
            const clean = raw.map(sanitizeCartItem).filter(Boolean);
            if (clean.length !== raw.length) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
            }
            return clean;
        } catch {
            localStorage.removeItem(STORAGE_KEY);
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

    function productsHref() {
        return window.location.pathname.includes('/pages/') ? 'productos.html' : 'pages/productos.html';
    }

    function emptyCartHTML(compact) {
        const href = productsHref();
        return `
            <div class="cart-empty-state${compact ? ' is-compact' : ''}">
                <div class="cart-empty-icon" aria-hidden="true"><i class="fas fa-shopping-bag"></i></div>
                <p class="cart-empty-title">Tu carrito está vacío</p>
                <p class="cart-empty-text">${compact
                    ? 'Agrega yogures desde el catálogo y arma tu pedido.'
                    : 'Aún no agregaste yogures. Explora el catálogo y arma tu pedido.'}</p>
                <a class="cart-empty-cta" href="${href}">Ver productos</a>
            </div>`;
    }

    function renderSidebar() {
        const container = document.getElementById('cart-sidebar-items');
        if (!container) return;

        const items = syncFromStorage();
        const clearBtn = document.getElementById('btn-clear-cart-sidebar');
        if (clearBtn) clearBtn.hidden = items.length === 0;

        if (items.length === 0) {
            container.innerHTML = emptyCartHTML(true);
            const totalEl = document.getElementById('cartTotalAmount');
            if (totalEl) totalEl.textContent = '$0';
            return;
        }

        const total = getCartTotal(items);
        container.innerHTML = `
            <div class="cart-select-bar">
                <label class="cart-select-all">
                    <input type="checkbox" data-action="toggle-all" aria-label="Seleccionar todos">
                    <span>Todos</span>
                </label>
                <button type="button" class="cart-remove-selected" data-action="remove-selected" disabled>Eliminar</button>
            </div>
            ${items.map((item) => {
            const thumb = item.imagen
                ? `<img class="cart-item-thumb" src="${escapeHtml(item.imagen)}" alt="" onerror="this.style.display='none'">`
                : `<span class="shop-bag-ph" aria-hidden="true"><i class="fas fa-cheese"></i></span>`;
            return `
            <div class="cart-item" data-id="${escapeHtml(item.id)}">
                <label class="cart-pick">
                    <input type="checkbox" class="cart-item-check" data-id="${escapeHtml(item.id)}" aria-label="Seleccionar ${escapeHtml(item.nombre)}">
                </label>
                ${thumb}
                <div class="cart-item-info">
                    <span class="cart-item-name">${escapeHtml(item.nombre)}</span>
                    <div class="cart-item-controls shop-qty">
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="-1" aria-label="Disminuir cantidad">-</button>
                        <span class="cart-item-qty" aria-label="Cantidad">${escapeHtml(item.cantidad)}</span>
                        <button type="button" class="cart-qty-btn" data-action="qty" data-id="${escapeHtml(item.id)}" data-delta="1" aria-label="Aumentar cantidad">+</button>
                    </div>
                    <span class="cart-item-price">${formatCOP(Number(item.precio) * item.cantidad)}</span>
                </div>
                <button type="button" class="cart-remove-btn" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="Eliminar ${escapeHtml(item.nombre)}">
                    <i class="fas fa-trash-alt" aria-hidden="true"></i>
                </button>
            </div>`;
        }).join('')}`;

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
            removeItemConfirm(id);
            return;
        }
        if (Number.isFinite(Number(carrito[idx].stock)) && next >= Number(carrito[idx].stock) && cantidad > prev) {
            showToast('Stock máximo alcanzado', 'warning');
        }
        carrito[idx].cantidad = next;

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

    async function removeItemConfirm(id) {
        syncFromStorage();
        const item = carrito.find((i) => String(i.id) === String(id));
        const nombre = item?.nombre || 'este producto';
        const ok = utils().confirmAction
            ? await utils().confirmAction({
                title: 'Quitar del carrito',
                message: `¿Seguro que quieres eliminar "${nombre}"?`,
                confirmText: 'Sí, eliminar',
                cancelText: 'Cancelar',
                danger: true,
                type: 'warning'
            })
            : window.confirm(`¿Eliminar ${nombre}?`);
        if (!ok) return;
        removeItem(id);
    }

    function syncSelectToolbar(root) {
        const scope = root || document;
        const checks = [...scope.querySelectorAll('.cart-item-check')];
        const selected = checks.filter((c) => c.checked);
        const toggleAll = scope.querySelector('[data-action="toggle-all"]');
        const removeBtn = scope.querySelector('[data-action="remove-selected"]');
        if (toggleAll) {
            toggleAll.checked = checks.length > 0 && selected.length === checks.length;
            toggleAll.indeterminate = selected.length > 0 && selected.length < checks.length;
        }
        if (removeBtn) {
            removeBtn.disabled = selected.length === 0;
            removeBtn.textContent = selected.length > 0
                ? `Eliminar (${selected.length})`
                : 'Eliminar';
        }
    }

    async function removeSelectedConfirm(root) {
        const scope = root || document.getElementById('cart-sidebar-items') || document;
        const ids = [...scope.querySelectorAll('.cart-item-check:checked')].map((c) => c.dataset.id);
        if (!ids.length) {
            showToast('Selecciona al menos un producto', 'warning');
            return;
        }
        const ok = utils().confirmAction
            ? await utils().confirmAction({
                title: 'Eliminar seleccionados',
                message: `¿Eliminar ${ids.length} producto${ids.length === 1 ? '' : 's'} del carrito?`,
                confirmText: 'Sí, eliminar',
                cancelText: 'Cancelar',
                danger: true,
                type: 'warning'
            })
            : window.confirm(`¿Eliminar ${ids.length} productos?`);
        if (!ok) return;
        syncFromStorage();
        const set = new Set(ids.map(String));
        carrito = carrito.filter((i) => !set.has(String(i.id)));
        guardarCarrito();
        updateCounter();
        renderSidebar();
        showToast('Productos eliminados', 'info');
    }

    function addToCart(producto) {
        if (!producto || producto.id == null) return;

        syncFromStorage();
        const stock = Number(producto.stock);
        const qtyAdd = Math.max(1, Number(producto.cantidad) || 1);
        const lineId = producto.lineId || producto.id;
        const label = producto.tamano
            ? `${producto.nombre} · ${producto.tamano}`
            : producto.nombre;
        const existe = carrito.find((item) => String(item.id) === String(lineId));

        if (existe) {
            const next = Number(existe.cantidad) + qtyAdd;
            if (Number.isFinite(stock) && stock >= 0 && next > stock) {
                showToast('No hay más stock disponible', 'warning');
                return;
            }
            existe.cantidad = next;
            existe.precio = Number(producto.precio) || existe.precio;
            if (Number.isFinite(stock)) existe.stock = stock;
        } else {
            if (Number.isFinite(stock) && stock <= 0) {
                showToast('Producto sin stock', 'error');
                return;
            }
            carrito.push({
                id: lineId,
                nombre: label,
                precio: Number(producto.precio),
                imagen: producto.imagen_url || producto.imagen || '',
                stock: Number.isFinite(stock) ? stock : null,
                cantidad: qtyAdd,
                tamano: producto.tamano || ''
            });
        }

        guardarCarrito();
        updateCounter();
        pulseBadge();
        renderSidebar();
        showToast(`${label} agregado`, 'success');
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

    function customerName() {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
            return usuario ? `${usuario.nombre || ''}${usuario.apellido ? ' ' + usuario.apellido : ''}`.trim() : '';
        } catch {
            return '';
        }
    }

    function greeting() {
        const h = new Date().getHours();
        if (h < 12) return 'Buenos días';
        if (h < 19) return 'Buenas tardes';
        return 'Buenas noches';
    }

    function productMeta(item) {
        let size = item.tamano || item.presentacion || '';
        let name = String(item.nombre || 'Producto');
        if (!size && name.includes('·')) {
            const parts = name.split('·');
            name = parts[0].trim();
            size = parts.slice(1).join('·').trim();
        } else {
            name = name.replace(/\s·\s.*$/, '').trim();
        }
        return { name, size };
    }

    function productLines(item) {
        const { name, size } = productMeta(item);
        const unit = Number(item.precio);
        const qty = Number(item.cantidad);
        return [
            `- ${name}`,
            size ? `- Presentación: ${size}` : null,
            `- Cantidad: ${qty} ${qty === 1 ? 'unidad' : 'unidades'}`,
            `- Precio unitario: ${formatCOP(unit)}`,
            `- Subtotal: ${formatCOP(unit * qty)}`
        ].filter(Boolean);
    }

    function buildWhatsAppMessage(items) {
        const company = getConfig().COMPANY_NAME || 'YogurASO';
        const location = getConfig().COMPANY_LOCATION || 'Neiva y Tello, Huila';
        const total = getCartTotal(items);
        const units = items.reduce((n, i) => n + Number(i.cantidad || 0), 0);
        const nombre = customerName();
        const blocks = [];

        items.forEach((item, i) => {
            if (i > 0) blocks.push('');
            blocks.push(...productLines(item));
        });

        return [
            `${greeting()}.`,
            '',
            'Cordial saludo.',
            '',
            `Solicito el siguiente pedido de yogurt artesanal ${company}, según lo seleccionado en la tienda:`,
            '',
            'Especificación de productos:',
            ...blocks,
            '',
            'Resumen:',
            `- Referencias: ${items.length}`,
            `- Unidades: ${units}`,
            `- Total del pedido: ${formatCOP(total)}`,
            '',
            `Cobertura: ${location}.`,
            'Quedo atento a confirmación, disponibilidad y datos de entrega.',
            '',
            'Gracias.',
            nombre || ''
        ].filter((line, idx, arr) => line !== '' || arr[idx - 1] !== '').join('\n').trim();
    }

    function previewCheckout(items) {
        return new Promise((resolve) => {
            const total = getCartTotal(items);
            const units = items.reduce((n, i) => n + Number(i.cantidad || 0), 0);
            const overlay = document.createElement('div');
            overlay.className = 'order-preview-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.innerHTML = `
                <div class="order-preview">
                    <p class="order-preview-kicker">Antes de WhatsApp</p>
                    <h3>Revisa tu pedido</h3>
                    <p class="order-preview-lead">Esto es lo que vas a enviar. Si está bien, se abre WhatsApp con el mensaje listo.</p>
                    <ul class="order-preview-list">
                        ${items.map((item) => {
                            const { name, size } = productMeta(item);
                            return `<li>
                                <strong>${escapeHtml(name)}</strong>
                                <span>${size ? escapeHtml(size) + ' · ' : ''}${escapeHtml(item.cantidad)} und. · ${formatCOP(Number(item.precio) * Number(item.cantidad))}</span>
                            </li>`;
                        }).join('')}
                    </ul>
                    <div class="order-preview-total">
                        <span>${items.length} referencias · ${units} unidades</span>
                        <strong>${formatCOP(total)}</strong>
                    </div>
                    <div class="order-preview-actions">
                        <button type="button" class="order-preview-cancel">Seguir editando</button>
                        <button type="button" class="order-preview-ok"><i class="fab fa-whatsapp" aria-hidden="true"></i> Enviar pedido</button>
                    </div>
                </div>
            `;
            const close = (ok) => {
                overlay.remove();
                document.removeEventListener('keydown', onKey);
                resolve(ok);
            };
            const onKey = (e) => { if (e.key === 'Escape') close(false); };
            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
            overlay.querySelector('.order-preview-cancel').addEventListener('click', () => close(false));
            overlay.querySelector('.order-preview-ok').addEventListener('click', () => close(true));
            document.addEventListener('keydown', onKey);
            document.body.appendChild(overlay);
            overlay.querySelector('.order-preview-ok').focus();
        });
    }

    const ORDERS_KEY = 'yogur_order_history';

    function saveOrderHistory(items) {
        let usuario = null;
        try { usuario = JSON.parse(localStorage.getItem('usuario') || 'null'); } catch { usuario = null; }
        let orders = [];
        try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch { orders = []; }
        if (!Array.isArray(orders)) orders = [];
        orders.unshift({
            id: `WA-${Date.now()}`,
            userId: usuario?.id || null,
            email: usuario?.email || null,
            createdAt: new Date().toISOString(),
            total: getCartTotal(items),
            items: items.map((item) => ({
                id: item.id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                tamano: item.tamano || item.presentacion || ''
            }))
        });
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 40)));
    }

    async function checkoutWhatsApp() {
        const items = syncFromStorage();
        if (items.length === 0) {
            showToast('Tu carrito está vacío', 'warning');
            return;
        }

        const ok = await previewCheckout(items);
        if (!ok) return;

        saveOrderHistory(items);

        const wa = getConfig().WHATSAPP_NUMBER || '573001234567';
        const url = `https://wa.me/${wa}?text=${encodeURIComponent(buildWhatsAppMessage(items))}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    function openSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (!sidebar) return;
        renderSidebar();
        sidebar.classList.add('show');
        overlay?.classList.add('show');
        sidebar.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cart-open');
    }

    function closeSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (!sidebar) return;
        sidebar.classList.remove('show');
        overlay?.classList.remove('show');
        sidebar.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cart-open');
    }

    function bindSidebar() {
        const cartBtn = document.getElementById('cartBtn');
        const close = document.getElementById('closeCart');
        const overlay = document.getElementById('cartOverlay');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const sidebarItems = document.getElementById('cart-sidebar-items');
        const clearSidebar = document.getElementById('btn-clear-cart-sidebar');
        const clearPage = document.getElementById('btn-clear-cart');

        if (cartBtn) cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSidebar();
        });
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
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                if (action === 'qty') changeQuantity(id, Number(btn.dataset.delta));
                else if (action === 'remove') removeItemConfirm(id);
                else if (action === 'remove-selected') removeSelectedConfirm(sidebarItems);
            });
            sidebarItems.addEventListener('change', (e) => {
                if (e.target.classList.contains('cart-item-check') || e.target.dataset.action === 'toggle-all') {
                    if (e.target.dataset.action === 'toggle-all') {
                        const on = e.target.checked;
                        sidebarItems.querySelectorAll('.cart-item-check').forEach((c) => { c.checked = on; });
                    }
                    syncSelectToolbar(sidebarItems);
                }
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
        removeItemConfirm,
        removeSelectedConfirm,
        syncSelectToolbar,
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
