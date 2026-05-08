(function () {
    let carrito = JSON.parse(localStorage.getItem('yogur_cart') || '[]');

    function guardarCarrito() {
        localStorage.setItem('yogur_cart', JSON.stringify(carrito));
    }

    function showToast(message) {
        const current = document.querySelector('.toast-notification');
        if (current) current.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification show';
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas fa-check"></i></div>
            <div class="toast-message"><strong>${message}</strong></div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 250);
        }, 1700);
    }

    function updateCounter() {
        const contador = document.getElementById('cart-count');
        if (!contador) return;
        const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        contador.textContent = totalItems;
    }

    function renderSidebar() {
        const container = document.getElementById('cart-items-container');
        const sidebar = document.getElementById('cartSidebar');
        if (!container || !sidebar || !sidebar.contains(container)) return;

        const items = JSON.parse(localStorage.getItem('yogur_cart') || '[]');

        if (items.length === 0) {
            container.innerHTML = '<div class="cart-empty"><i class="fas fa-cart-shopping"></i> Tu carrito está vacío</div>';
            const totalEl = document.getElementById('cartTotalAmount');
            if (totalEl) totalEl.textContent = '$0';
            return;
        }

        let total = 0;
        container.innerHTML = items.map(item => {
            total += Number(item.precio) * item.cantidad;
            return `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${item.nombre}</span>
                        <div class="cart-item-controls">
                            <button class="cart-qty-btn" onclick="window.Cart.sidebarQty('${item.id}',-1)">-</button>
                            <span class="cart-item-qty">${item.cantidad}</span>
                            <button class="cart-qty-btn" onclick="window.Cart.sidebarQty('${item.id}',1)">+</button>
                            <span class="cart-item-price">$${(Number(item.precio) * item.cantidad).toLocaleString('es-CO')}</span>
                        </div>
                    </div>
                    <button class="cart-remove-btn" onclick="window.Cart.sidebarRemove('${item.id}')"><i class="fas fa-trash-alt"></i></button>
                </div>`;
        }).join('');

        const totalEl = document.getElementById('cartTotalAmount');
        if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-CO')}`;
    }

    function sidebarQty(id, delta) {
        let items = JSON.parse(localStorage.getItem('yogur_cart') || '[]');
        const idx = items.findIndex(i => i.id == id);
        if (idx === -1) return;
        items[idx].cantidad += delta;
        if (items[idx].cantidad <= 0) items.splice(idx, 1);
        carrito = items;
        guardarCarrito();
        updateCounter();
        renderSidebar();
    }

    function sidebarRemove(id) {
        carrito = carrito.filter(i => i.id != id);
        guardarCarrito();
        updateCounter();
        renderSidebar();
        showToast('Producto eliminado');
    }

    function addToCart(producto) {
        const existe = carrito.find((item) => item.id == producto.id);

        if (existe) {
            existe.cantidad += 1;
        } else {
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: Number(producto.precio),
                imagen: producto.imagen_url || '',
                cantidad: 1
            });
        }

        guardarCarrito();
        updateCounter();
        renderSidebar();
        showToast(`${producto.nombre} agregado al carrito`);
    }

    function getCart() {
        return JSON.parse(localStorage.getItem('yogur_cart') || '[]');
    }

    function clearCart() {
        localStorage.removeItem('yogur_cart');
        carrito = [];
        updateCounter();
    }

    function openSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (!sidebar || !overlay) return;
        renderSidebar();
        sidebar.classList.add('show');
        overlay.classList.add('show');
    }

    function closeSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (!sidebar || !overlay) return;
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    }

    function bindSidebar() {
        const cartBtn = document.getElementById('cartBtn');
        const close = document.getElementById('closeCart');
        const overlay = document.getElementById('cartOverlay');

        if (cartBtn) cartBtn.addEventListener('click', openSidebar);
        if (close) close.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);
    }

    window.Cart = {
        addToCart,
        updateCounter,
        getCart,
        clearCart,
        showToast,
        renderSidebar,
        sidebarQty,
        sidebarRemove
    };

    document.addEventListener('DOMContentLoaded', () => {
        updateCounter();
        bindSidebar();
    });
})();
