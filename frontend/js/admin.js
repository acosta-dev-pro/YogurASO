import { fetchProducts, createProduct, deleteProduct } from './api.js';
document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const token = localStorage.getItem('token');
    if (!token || !usuario || usuario.rol !== 'admin') { window.location.href = 'login.html'; return; }
    const modal = document.getElementById('modal-producto');
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    const btnCerrar = document.querySelector('.close-modal');
    const formProducto = document.getElementById('form-producto');
    cargarTablaProductos();
    if (btnNuevo) btnNuevo.onclick = () => modal.style.display = 'block';
    if (btnCerrar) btnCerrar.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };
    if (formProducto) {
        formProducto.onsubmit = async (e) => {
            e.preventDefault();
            const nuevo = {
                nombre: document.getElementById('p-nombre').value,
                precio: document.getElementById('p-precio').value,
                stock: document.getElementById('p-stock').value,
                categoria_id: document.getElementById('p-categoria').value,
                descripcion: document.getElementById('p-descripcion').value,
                imagen_url: ''
            };
            const res = await createProduct(nuevo, token);
            if (res.success) { alert('Producto guardado'); formProducto.reset(); modal.style.display = 'none'; cargarTablaProductos(); }
            else alert('Error al guardar');
        };
    }
    document.getElementById('btn-logout').onclick = () => { localStorage.clear(); window.location.href = '../index.html'; };
});
async function cargarTablaProductos() {
    const lista = document.getElementById('admin-productos-lista');
    const productos = await fetchProducts();
    if (!lista) return;
    lista.innerHTML = productos.map(p => <tr><td>#</td><td><strong></strong></td><td></td><td>-Force{parseFloat(p.precio).toLocaleString('es-CO')}</td><td> und</td><td><button class="btn-delete" data-id="">🗑️ Borrar</button></td></tr>).join('');
    document.querySelectorAll('.btn-delete').forEach(btn => btn.onclick = async () => { if (confirm('¿Eliminar?')) { await deleteProduct(btn.dataset.id, localStorage.getItem('token')); cargarTablaProductos(); } });
}
