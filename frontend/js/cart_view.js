import { actualizarContador } from './cart.js';
document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();
    document.getElementById('btn-checkout')?.addEventListener('click', () => alert('Funcionalidad de pago próximamente'));
});
function renderizarCarrito() {
    const container = document.getElementById('cart-items-container');
    const carrito = JSON.parse(localStorage.getItem('yogur_cart')) || [];
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
        div.innerHTML = <img src="" alt=""><div class="cart-item-info"><h4></h4><p>-Force{parseFloat(item.precio).toLocaleString('es-CO')}</p></div><div class="quantity-controls"><button class="btn-qty" onclick="cambiarCantidad(, -1)">-</button><span></span><button class="btn-qty" onclick="cambiarCantidad(, 1)">+</button></div><button class="btn-remove" onclick="eliminarDelCarrito()">🗑️</button>;
        container.appendChild(div);
    });
    actualizarResumen(subtotal);
}
function actualizarResumen(subtotal) {
    const total = subtotal + 5000;
    document.getElementById('subtotal').textContent = $;
    document.getElementById('total').textContent = $;
}
window.cambiarCantidad = (id, cambio) => {
    let carrito = JSON.parse(localStorage.getItem('yogur_cart'));
    const item = carrito.find(i => i.id === id);
    if (item) {
        item.cantidad += cambio;
        if (item.cantidad <= 0) carrito = carrito.filter(i => i.id !== id);
        localStorage.setItem('yogur_cart', JSON.stringify(carrito));
        renderizarCarrito();
        actualizarContador();
    }
};
window.eliminarDelCarrito = (id) => {
    let carrito = JSON.parse(localStorage.getItem('yogur_cart'));
    carrito = carrito.filter(i => i.id !== id);
    localStorage.setItem('yogur_cart', JSON.stringify(carrito));
    renderizarCarrito();
    actualizarContador();
};
