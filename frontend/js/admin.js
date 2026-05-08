import { fetchProducts, createProduct, updateProduct, deleteProduct } from './api.js';

const API_BASE = 'http://localhost:3000/api';

const categoriaMap = {
    natural: 'Natural',
    frutas: 'Con Frutas',
    griego: 'Griego',
    sin_lactosa: 'Sin Lactosa'
};

let editandoId = null;

function getToken() {
    return localStorage.getItem('token');
}

function getUsuario() {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
}

function abrirModal(titulo) {
    const modal = document.getElementById('modal-producto');
    const title = document.getElementById('modal-title');
    if (title) title.textContent = titulo;
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }
}

function cerrarModal() {
    const modal = document.getElementById('modal-producto');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

function limpiarFormulario() {
    editandoId = null;
    const form = document.getElementById('form-producto');
    form?.reset();
    const idInput = document.getElementById('p-id');
    if (idInput) idInput.value = '';
    // Reset image UI
    resetImageUpload();
}

function resetImageUpload() {
    const placeholder = document.getElementById('image-upload-placeholder');
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('image-remove-btn');
    const fileInput = document.getElementById('p-imagen-file');
    const hiddenInput = document.getElementById('p-imagen');
    if (placeholder) placeholder.style.display = 'flex';
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (removeBtn) removeBtn.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (hiddenInput) hiddenInput.value = '';
}

function setImagePreview(url) {
    const placeholder = document.getElementById('image-upload-placeholder');
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('image-remove-btn');
    if (!url) { resetImageUpload(); return; }
    if (placeholder) placeholder.style.display = 'none';
    if (preview) { preview.src = url; preview.style.display = 'block'; }
    if (removeBtn) removeBtn.style.display = 'inline-flex';
}

function setupImageUpload() {
    const area = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('p-imagen-file');
    const hiddenInput = document.getElementById('p-imagen');
    const removeBtn = document.getElementById('image-remove-btn');
    if (!area || !fileInput) return;

    // Click on area opens file picker
    area.addEventListener('click', (e) => {
        if (e.target === removeBtn || removeBtn?.contains(e.target)) return;
        fileInput.click();
    });

    // Drag & drop
    area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFileSelected(file, hiddenInput);
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) handleFileSelected(file, hiddenInput);
    });

    removeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        resetImageUpload();
    });
}

function handleFileSelected(file, hiddenInput) {
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    // Store the file object to upload later
    hiddenInput._pendingFile = file;
}

async function uploadPendingImage(token) {
    const hiddenInput = document.getElementById('p-imagen');
    if (!hiddenInput?._pendingFile) return hiddenInput?.value || '';

    const formData = new FormData();
    formData.append('imagen', hiddenInput._pendingFile);

    try {
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            hiddenInput.value = data.url;
            hiddenInput._pendingFile = null;
            return data.url;
        }
    } catch (err) {
        console.error('Error al subir imagen:', err);
    }
    return hiddenInput?.value || '';
}

function renderRows(productos) {
    const lista = document.getElementById('admin-productos-lista');
    if (!lista) return;

    if (productos.length === 0) {
        lista.innerHTML = '<tr><td colspan="7">No hay productos registrados.</td></tr>';
        return;
    }

    lista.innerHTML = productos.map((p) => `
        <tr>
            <td>#${p.id}</td>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.categoria || 'Yogur'}</td>
            <td>$${Number(p.precio || 0).toLocaleString('es-CO')}</td>
            <td>${p.stock || 0} und</td>
            <td>${p.activo ? 'Activo' : 'Inactivo'}</td>
            <td>
                <button class="btn-edit" data-id="${p.id}">Editar</button>
                <button class="btn-delete" data-id="${p.id}">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function payloadDesdeFormulario() {
    const categoriaKey = document.getElementById('p-categoria')?.value || 'natural';
    return {
        nombre: document.getElementById('p-nombre')?.value.trim(),
        precio: Number(document.getElementById('p-precio')?.value || 0),
        stock: Number(document.getElementById('p-stock')?.value || 0),
        descripcion: document.getElementById('p-descripcion')?.value.trim() || '',
        imagen_url: document.getElementById('p-imagen')?.value.trim() || '',
        categoria: categoriaMap[categoriaKey] || 'Natural',
        activo: document.getElementById('p-activo')?.checked ?? true
    };
}

function llenarFormulario(producto) {
    document.getElementById('p-id').value = producto.id;
    document.getElementById('p-nombre').value = producto.nombre || '';
    document.getElementById('p-precio').value = producto.precio || 0;
    document.getElementById('p-stock').value = producto.stock || 0;
    document.getElementById('p-descripcion').value = producto.descripcion || '';
    document.getElementById('p-imagen').value = producto.imagen_url || '';
    // Show existing image preview
    if (producto.imagen_url) setImagePreview(producto.imagen_url);
    else resetImageUpload();

    const categoriaKey = Object.keys(categoriaMap).find((key) => categoriaMap[key] === producto.categoria) || 'natural';
    document.getElementById('p-categoria').value = categoriaKey;
    document.getElementById('p-activo').checked = Boolean(producto.activo);
}

async function cargarTablaProductos() {
    const productos = await fetchProducts(true);
    renderRows(productos);

    document.querySelectorAll('.btn-edit').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const producto = productos.find((item) => item.id === id);
            if (!producto) return;
            editandoId = id;
            llenarFormulario(producto);
            abrirModal('Editar Producto');
        });
    });

    document.querySelectorAll('.btn-delete').forEach((btn) => {
        btn.addEventListener('click', async () => {
            if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
            const res = await deleteProduct(btn.dataset.id, getToken());
            if (!res.success) {
                alert(res.message || 'No se pudo eliminar');
                return;
            }
            alert('Producto eliminado');
            await cargarTablaProductos();
        });
    });
}

function setupAdminEvents() {
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    const btnCerrar = document.querySelector('.close-modal');
    const modal = document.getElementById('modal-producto');
    const form = document.getElementById('form-producto');
    const logoutBtn = document.getElementById('btn-logout');

    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            limpiarFormulario();
            abrirModal('Nuevo Producto');
        });
    }

    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = getToken();
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Guardando...'; }

        // Upload image if there's a pending file
        const imagenUrl = await uploadPendingImage(token);
        const payload = payloadDesdeFormulario();
        payload.imagen_url = imagenUrl;

        const res = editandoId
            ? await updateProduct(editandoId, payload, token)
            : await createProduct(payload, token);

        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar'; }

        if (!res.success) {
            alert(res.message || 'No se pudo guardar el producto');
            return;
        }

        alert(editandoId ? 'Producto actualizado' : 'Producto creado');
        cerrarModal();
        limpiarFormulario();
        await cargarTablaProductos();
    });

    logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = getUsuario();
    const token = getToken();

    if (!token || !usuario || usuario.rol !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    setupImageUpload();
    setupAdminEvents();
    await cargarTablaProductos();
    window.Cart?.updateCounter();
});
