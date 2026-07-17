/**
 * admin.js — Panel administrador (CRUD de productos)
 * Aquí se gestiona: listar, crear, editar, eliminar e imágenes.
 * Solo accesible con rol "admin" (JWT).
 * Diseño: admin.html + styles.css (.admin-panel, .stat-card, tabla)
 */
import { fetchProducts, createProduct, updateProduct, deleteProduct, uploadImage } from './api.js';

/** Mapeo de valores del <select> a nombres de categoría en BD */
const categoriaMap = {
    natural: 'Natural',
    frutas: 'Con Frutas',
    griego: 'Griego',
    sin_lactosa: 'Sin Lactosa',
    leches: 'Leches',
    quesos: 'Quesos',
    kumis: 'Kumis',
    arequipe: 'Arequipe',
    suero: 'Suero Costeño'
};

let editandoId = null;
let allAdminProducts = [];

const escapeHtml = (v) => window.YogurUtils?.escapeHtml(v) || String(v ?? '');
const toast = (msg, type = 'success') => window.YogurUtils?.showToast?.(msg, type);
const confirmAction = (opts) => window.YogurUtils?.confirmAction?.(opts);

function getToken() {
    return localStorage.getItem('token');
}

function getUsuario() {
    try {
        return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
        return null;
    }
}

function abrirModal(titulo) {
    const modal = document.getElementById('modal-producto');
    const title = document.getElementById('modal-title');
    if (title) title.textContent = titulo;
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('p-nombre')?.focus();
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
    document.getElementById('form-producto')?.reset();
    const idInput = document.getElementById('p-id');
    if (idInput) idInput.value = '';
    resetImageUpload();
}

function resetImageUpload() {
    const placeholder = document.getElementById('image-upload-placeholder');
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('image-remove-btn');
    const fileInput = document.getElementById('p-imagen-file');
    const hiddenInput = document.getElementById('p-imagen');
    if (placeholder) placeholder.style.display = 'flex';
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }
    if (removeBtn) removeBtn.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (hiddenInput) {
        hiddenInput.value = '';
        hiddenInput._pendingFile = null;
    }
}

function setImagePreview(url) {
    const placeholder = document.getElementById('image-upload-placeholder');
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('image-remove-btn');
    if (!url) {
        resetImageUpload();
        return;
    }
    if (placeholder) placeholder.style.display = 'none';
    if (preview) {
        preview.src = url;
        preview.style.display = 'block';
    }
    if (removeBtn) removeBtn.style.display = 'inline-flex';
}

function setupImageUpload() {
    const area = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('p-imagen-file');
    const hiddenInput = document.getElementById('p-imagen');
    const removeBtn = document.getElementById('image-remove-btn');
    if (!area || !fileInput) return;

    area.addEventListener('click', (e) => {
        if (e.target === removeBtn || removeBtn?.contains(e.target)) return;
        fileInput.click();
    });

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
    });
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
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
        toast('Solo se permiten imágenes JPG, PNG, WEBP o GIF', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        toast('La imagen no puede superar 5 MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    hiddenInput._pendingFile = file;
}

async function uploadPendingImage(token) {
    const hiddenInput = document.getElementById('p-imagen');
    if (!hiddenInput?._pendingFile) return { success: true, url: hiddenInput?.value || '' };

    const data = await uploadImage(hiddenInput._pendingFile, token);
    if (data.success && data.url) {
        hiddenInput.value = data.url;
        hiddenInput._pendingFile = null;
        return { success: true, url: data.url };
    }
    return { success: false, message: data.message || 'Error al subir la imagen' };
}

function updateDashboard(productos) {
    const total = productos.length;
    const stock = productos.reduce((acc, p) => acc + Number(p.stock || 0), 0);
    const cats = new Set(productos.map((p) => p.categoria).filter(Boolean)).size;
    const activos = productos.filter((p) => p.activo).length;

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    set('stat-productos', String(total));
    set('stat-stock', String(stock));
    set('stat-categorias', String(cats));
    set('stat-activos', String(activos));
    set('stat-updated', new Date().toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short'
    }));
}

function getVisibleProducts() {
    const q = (document.getElementById('admin-search')?.value || '').trim().toLowerCase();
    if (!q) return allAdminProducts;
    return allAdminProducts.filter((p) =>
        String(p.nombre || '').toLowerCase().includes(q) ||
        String(p.categoria || '').toLowerCase().includes(q) ||
        String(p.id).includes(q)
    );
}

function renderRows(productos) {
    const lista = document.getElementById('admin-productos-lista');
    if (!lista) return;

    if (productos.length === 0) {
        lista.innerHTML = '<tr><td colspan="7">No hay productos que coincidan.</td></tr>';
        return;
    }

    lista.innerHTML = productos.map((p) => `
        <tr>
            <td>#${escapeHtml(p.id)}</td>
            <td>
                <div class="admin-product-cell">
                    ${p.imagen_url
                        ? `<img src="${escapeHtml(p.imagen_url)}" alt="" class="admin-thumb" onerror="this.style.display='none'">`
                        : '<span class="admin-thumb placeholder" aria-hidden="true"><i class="fas fa-image"></i></span>'}
                    <strong>${escapeHtml(p.nombre)}</strong>
                </div>
            </td>
            <td>${escapeHtml(p.categoria || 'Yogur')}</td>
            <td>$${Number(p.precio || 0).toLocaleString('es-CO')}</td>
            <td>${escapeHtml(p.stock || 0)} und</td>
            <td><span class="status-pill ${p.activo ? 'is-active' : 'is-inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <button type="button" class="btn-edit" data-id="${escapeHtml(p.id)}">Editar</button>
                <button type="button" class="btn-delete" data-id="${escapeHtml(p.id)}">Eliminar</button>
            </td>
        </tr>
    `).join('');

    lista.querySelectorAll('.btn-edit').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const producto = allAdminProducts.find((item) => item.id === id);
            if (!producto) return;
            editandoId = id;
            llenarFormulario(producto);
            abrirModal('Editar Producto');
        });
    });

    lista.querySelectorAll('.btn-delete').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const producto = allAdminProducts.find((item) => String(item.id) === String(id));
            const ok = confirmAction
                ? await confirmAction({
                    title: 'Eliminar producto',
                    message: `¿Estás seguro de eliminar "${producto?.nombre || 'este producto'}"? Esta acción no se puede deshacer.`,
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    danger: true
                })
                : window.confirm('¿Eliminar este producto?');

            if (!ok) return;

            const res = await deleteProduct(id, getToken());
            if (!res.success) {
                toast(res.message || 'No se pudo eliminar', 'error');
                return;
            }
            toast('Producto eliminado', 'success');
            await cargarTablaProductos();
        });
    });
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
    if (producto.imagen_url) setImagePreview(producto.imagen_url);
    else resetImageUpload();

    const categoriaKey = Object.keys(categoriaMap).find((key) => categoriaMap[key] === producto.categoria) || 'natural';
    document.getElementById('p-categoria').value = categoriaKey;
    document.getElementById('p-activo').checked = Boolean(producto.activo);
}

async function cargarTablaProductos() {
    allAdminProducts = await fetchProducts(true, getToken());
    updateDashboard(allAdminProducts);
    renderRows(getVisibleProducts());
}

function setupAdminEvents() {
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    const btnCerrar = document.querySelector('.close-modal');
    const modal = document.getElementById('modal-producto');
    const form = document.getElementById('form-producto');
    const logoutBtn = document.getElementById('btn-logout');
    const search = document.getElementById('admin-search');

    search?.addEventListener('input', () => renderRows(getVisibleProducts()));

    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            limpiarFormulario();
            abrirModal('Nuevo Producto');
        });
    }

    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModal);
        btnCerrar.setAttribute('role', 'button');
        btnCerrar.setAttribute('tabindex', '0');
        btnCerrar.setAttribute('aria-label', 'Cerrar');
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = getToken();
        const submitBtn = form.querySelector('[type="submit"]');
        const payload = payloadDesdeFormulario();

        if (!payload.nombre) {
            toast('El nombre es requerido', 'error');
            return;
        }
        if (!Number.isFinite(payload.precio) || payload.precio < 0) {
            toast('Ingresa un precio válido', 'error');
            return;
        }
        if (!Number.isFinite(payload.stock) || payload.stock < 0) {
            toast('Ingresa un stock válido', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }

        const uploadResult = await uploadPendingImage(token);
        if (!uploadResult.success) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar';
            }
            toast(uploadResult.message || 'No se pudo subir la imagen', 'error');
            return;
        }

        payload.imagen_url = uploadResult.url;

        const res = editandoId
            ? await updateProduct(editandoId, payload, token)
            : await createProduct(payload, token);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar';
        }

        if (!res.success) {
            toast(res.message || 'No se pudo guardar el producto', 'error');
            return;
        }

        toast(editandoId ? 'Producto actualizado' : 'Producto creado', 'success');
        cerrarModal();
        limpiarFormulario();
        await cargarTablaProductos();
    });

    logoutBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        toast('Sesión cerrada', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 400);
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
