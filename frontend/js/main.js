import { fetchProducts } from './api.js';
import { agregarAlCarrito, actualizarContador } from './cart.js';
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('productos-container');
    if (container) {
        const productos = await fetchProducts();
        if (!productos || productos.length === 0) container.innerHTML = '<p>No hay productos disponibles</p>';
        else {
            container.innerHTML = productos.map(p => <div class="producto-card"><div class="producto-info"><h3></h3><p class="descripcion"></p><div class="producto-footer"><span class="precio">-Force{parseFloat(p.precio).toLocaleString('es-CO')}</span><button class="btn-add" data-id="">Agregar</button></div></div></div>).join('');
            productos.forEach(p => document.getElementById(tn-)?.addEventListener('click', () => agregarAlCarrito(p)));
        }
    }
    actualizarContador();
});
