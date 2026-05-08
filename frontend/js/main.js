import { fetchProducts } from './api.js';

function aplicarAnimacionesEntrada() {
    const revealItems = document.querySelectorAll('.beneficio-card, .nosotros-content, .nosotros-images, .section-title');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.16 });

    revealItems.forEach((el) => {
        el.classList.add('reveal-start');
        observer.observe(el);
    });
}

function mostrarBienvenida() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    const nombre = usuario?.nombre || 'a YogurASO';
    if (window.Cart?.showToast) {
        window.Cart.showToast(`Bienvenido ${nombre}`);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('main.js cargado');
    aplicarAnimacionesEntrada();
    setTimeout(mostrarBienvenida, 650);
    
    const container = document.getElementById('productos-container');
    if (!container) {
        console.error('No se encontró el contenedor');
        return;
    }

    // Mostrar carga
    container.innerHTML = '<p class="cargando">Cargando productos...</p>';

    fetchProducts()
        .then(function(productos) {
            console.log('Productos recibidos:', productos.length);
            
            if (productos.length === 0) {
                container.innerHTML = '<p>No hay productos disponibles</p>';
                return;
            }

            let html = '';
            for (let i = 0; i < productos.length; i++) {
                const p = productos[i];
                html += `
                    <div class="producto-card">
                        <div class="producto-img-container">
                            <img src="${p.imagen_url || 'https://via.placeholder.com/300x200?text=Yogur'}" 
                                 alt="${p.nombre}" class="producto-img"
                                 onerror="this.src='https://via.placeholder.com/300x200?text=Yogur'">
                        </div>
                        <div class="producto-info">
                            <div class="producto-name-row">
                                <h3>${p.nombre}</h3>
                                <span class="precio">$${Number(p.precio).toLocaleString('es-CO')}</span>
                            </div>
                            <p class="descripcion">${p.descripcion || ''}</p>
                            <div class="producto-footer">
                                <button class="btn-add" data-id="${p.id}" data-nombre="${p.nombre}" 
                                        data-precio="${p.precio}" data-imagen="${p.imagen_url || ''}">
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = html;

            // Agregar eventos a los botones
            const botones = document.querySelectorAll('.btn-add');
            for (let i = 0; i < botones.length; i++) {
                botones[i].addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Crear objeto producto con los datos del botón
                    const producto = {
                        id: this.dataset.id,
                        nombre: this.dataset.nombre,
                        precio: parseFloat(this.dataset.precio),
                        imagen_url: this.dataset.imagen
                    };
                    
                    console.log('Agregando:', producto);
                    window.Cart?.addToCart(producto);
                });
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
            container.innerHTML = '<p style="color:red">Error al cargar productos. ¿El backend está corriendo?</p>';
        });

    // Actualizar contador del carrito
    window.Cart?.updateCounter();
});