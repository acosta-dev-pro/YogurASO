let carrito = JSON.parse(localStorage.getItem('yogur_cart')) || [];
export function agregarAlCarrito(producto) {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) existe.cantidad += 1;
    else carrito.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen_url, cantidad: 1 });
    guardarCarrito();
    actualizarContador();
    alert(¡ agregado al carrito!);
}
function guardarCarrito() { localStorage.setItem('yogur_cart', JSON.stringify(carrito)); }
export function actualizarContador() {
    const contador = document.getElementById('cart-count');
    if (contador) contador.textContent = carrito.reduce((acc, item) => acc + item.cantidad, 0);
}
actualizarContador();
