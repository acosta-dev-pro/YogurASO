document.addEventListener('DOMContentLoaded', () => {
    console.log('Vista de carrito cargada');
    renderizarCarrito();
    
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            const carrito = window.Cart?.getCart() || [];
            if (carrito.length === 0) {
                alert('Tu carrito está vacío');
            } else {
                alert('Funcionalidad de pago próximamente');
            }
        });
    }
});

function renderizarCarrito() {
    const container = document.getElementById('cart-items-container');
    const carrito = window.Cart?.getCart() || [];
    
    console.log('Carrito actual:', carrito);
    
    if (!container) {
        console.error('No container');
        return;
    }
    
    if (carrito.length === 0) {
        container.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        actualizarResumen(0);
        return;
    }

    container.innerHTML = '';
    let subtotal = 0;

    carrito.forEach(item => {
        subtotal += item.precio * item.cantidad;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.setAttribute('data-id', item.id);
        div.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-name">${item.nombre}</span>
                <div class="cart-item-controls">
                    <button class="cart-qty-btn" onclick="window.cambiarCantidad(${item.id}, -1)">-</button>
                    <span class="cart-item-qty">${item.cantidad}</span>
                    <button class="cart-qty-btn" onclick="window.cambiarCantidad(${item.id}, 1)">+</button>
                    <span class="cart-item-price">$${(Number(item.precio) * item.cantidad).toLocaleString('es-CO')}</span>
                </div>
            </div>
            <button class="cart-remove-btn" onclick="window.eliminarDelCarrito(${item.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        container.appendChild(div);
    });

    actualizarResumen(subtotal);
}

function actualizarResumen(subtotal) {
    const envio = subtotal > 0 ? 5000 : 0;
    const total = subtotal + envio;
    
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString('es-CO')}`;
    if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-CO')}`;
}

// Funciones globales
window.cambiarCantidad = (id, cambio) => {
    let carrito = JSON.parse(localStorage.getItem('yogur_cart')) || [];
    const index = carrito.findIndex(i => i.id == id);
    
    if (index !== -1) {
        carrito[index].cantidad += cambio;
        
        if (carrito[index].cantidad <= 0) {
            carrito.splice(index, 1);
        }
        
        localStorage.setItem('yogur_cart', JSON.stringify(carrito));
        renderizarCarrito();
        window.Cart?.updateCounter();
        mostrarNotificacion('Carrito actualizado');
    }
};

window.eliminarDelCarrito = (id) => {
    let carrito = JSON.parse(localStorage.getItem('yogur_cart')) || [];
    carrito = carrito.filter(i => i.id != id);
    localStorage.setItem('yogur_cart', JSON.stringify(carrito));
    renderizarCarrito();
    window.Cart?.updateCounter();
    mostrarNotificacion('Producto eliminado');
};

function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 2000);
}