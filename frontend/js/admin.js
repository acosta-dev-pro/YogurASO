/**
 * admin.js — Panel administrador (CRUD de productos + usuarios)
 */
import { fetchProducts, createProduct, updateProduct, deleteProduct, permanentlyDeleteProduct, uploadImage, fetchUsers, toggleUserActive } from './api.js';

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
let guardando = false;
let sortKey = 'id';
let sortDir = 'asc';
const selectedIds = new Set();

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

function setSubmitLabel(isEdit) {
    const btn = document.getElementById('btn-guardar-producto');
    if (btn) btn.textContent = isEdit ? 'Guardar cambios' : 'Crear producto';
}

function abrirModal(titulo, { isEdit = false } = {}) {
    const modal = document.getElementById('modal-producto');
    const title = document.getElementById('modal-title');
    const hint = document.getElementById('modal-hint');
    const eyebrow = document.getElementById('modal-eyebrow');
    if (title) title.textContent = titulo;
    if (eyebrow) eyebrow.textContent = isEdit ? 'Edición' : 'Alta';
    if (hint) {
        hint.textContent = isEdit
            ? 'Actualiza precio, stock, imagen o visibilidad del producto.'
            : 'Completa los datos del yogur para publicarlo en el catálogo.';
    }
    setSubmitLabel(isEdit);
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        setTimeout(() => document.getElementById('p-nombre')?.focus(), 30);
    }
}

function cerrarModal({ reset = true } = {}) {
    const modal = document.getElementById('modal-producto');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
    if (reset) limpiarFormulario();
}

function limpiarFormulario() {
    editandoId = null;
    guardando = false;
    const form = document.getElementById('form-producto');
    form?.reset();
    const idInput = document.getElementById('p-id');
    if (idInput) idInput.value = '';
    const activo = document.getElementById('p-activo');
    if (activo) activo.checked = true;
    const categoria = document.getElementById('p-categoria');
    if (categoria) categoria.value = 'natural';
    const colorFondo = document.getElementById('p-color-fondo');
    if (colorFondo) colorFondo.value = '#FFF8F4';
    const tipo = document.getElementById('p-letrero-tipo');
    const texto = document.getElementById('p-letrero');
    const desc = document.getElementById('p-descuento');
    if (tipo) tipo.value = '';
    if (texto) texto.value = '';
    if (desc) desc.value = '0';
    resetImageUpload();
    setSubmitLabel(false);
    syncPromoPreview();
}

function formatAdminCOP(n) {
    return window.YogurUtils?.formatCOP?.(n) || `$${Number(n || 0).toLocaleString('es-CO')}`;
}

function syncPromoPreview() {
    const precio = Number(document.getElementById('p-precio')?.value || 0);
    const tipoEl = document.getElementById('p-letrero-tipo');
    const textoEl = document.getElementById('p-letrero');
    const descEl = document.getElementById('p-descuento');
    const tipo = tipoEl?.value || '';
    let off = Math.round(Number(descEl?.value || 0));
    if (!Number.isFinite(off) || off < 0) off = 0;
    if (off > 80) off = 80;
    if (descEl && Number(descEl.value) !== off) descEl.value = String(off);

    const tipoNow = tipoEl?.value || '';
    if (textoEl) textoEl.disabled = tipoNow === '';
    if (textoEl && tipoNow === 'descuento' && off > 0) {
        const auto = `-${off}%`;
        if (!textoEl.value.trim() || /^-\d+%$/.test(textoEl.value.trim())) {
            textoEl.value = auto;
        }
    }
    if (textoEl && tipoNow === 'descuento' && off === 0 && /^-\d+%$/.test(textoEl.value.trim())) {
        textoEl.value = '';
    }
    if (textoEl && tipoNow === 'nuevo' && !textoEl.value.trim()) textoEl.value = 'Nuevo';
    if (textoEl && tipoNow === 'oferta' && !textoEl.value.trim()) textoEl.value = 'Oferta';
    if (textoEl && tipoNow === 'destacado' && !textoEl.value.trim()) textoEl.value = 'Destacado';
    if (textoEl && tipoNow === '') textoEl.value = '';

    const final = off > 0 ? Math.round(precio * (1 - off / 100)) : precio;
    const before = document.getElementById('admin-price-before');
    const after = document.getElementById('admin-price-after');
    const note = document.getElementById('admin-price-preview-note');
    const badge = document.getElementById('admin-price-preview-badge');
    const preview = document.getElementById('admin-price-preview');

    if (before) before.textContent = formatAdminCOP(precio);
    if (after) {
        after.textContent = formatAdminCOP(final);
        after.classList.toggle('is-sale', off > 0);
    }
    if (note) {
        note.textContent = off > 0
            ? `Ahorro ${off}%: el cliente ve ${formatAdminCOP(final)} (antes ${formatAdminCOP(precio)}).`
            : 'Sin descuento: se muestra el precio normal.';
    }
    if (badge) {
        const label = (textoEl?.value || '').trim();
        if (label) {
            badge.hidden = false;
            badge.textContent = label;
            badge.className = `admin-price-preview-badge badge-${tipoNow || 'nuevo'}`;
        } else {
            badge.hidden = true;
            badge.textContent = '';
        }
    }
    if (preview) preview.classList.toggle('has-discount', off > 0);
}

function setupPromoControls() {
    const precio = document.getElementById('p-precio');
    const tipo = document.getElementById('p-letrero-tipo');
    const texto = document.getElementById('p-letrero');
    const desc = document.getElementById('p-descuento');

    [precio, tipo, desc].forEach((el) => {
        el?.addEventListener('input', syncPromoPreview);
        el?.addEventListener('change', syncPromoPreview);
    });

    tipo?.addEventListener('change', () => {
        const t = tipo.value;
        if (texto) {
            if (t === 'nuevo') texto.value = 'Nuevo';
            else if (t === 'oferta') texto.value = 'Oferta';
            else if (t === 'destacado') texto.value = 'Destacado';
            else if (t === 'descuento') {
                const off = Math.round(Number(desc?.value || 0));
                texto.value = off > 0 ? `-${off}%` : '';
            } else texto.value = '';
        }
        syncPromoPreview();
    });

    texto?.addEventListener('input', () => {
        if (!texto.value.trim() && tipo?.value) {
            tipo.selectedIndex = -1;
        }
        syncPromoPreview();
    });
    texto?.addEventListener('change', () => {
        if (!texto.value.trim() && tipo?.value) {
            tipo.selectedIndex = -1;
        }
        syncPromoPreview();
    });

    syncPromoPreview();
}

function resetImageUpload() {
    const placeholder = document.getElementById('image-upload-placeholder');
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('image-remove-btn');
    const fileInput = document.getElementById('p-imagen-file');
    const hiddenInput = document.getElementById('p-imagen');
    if (placeholder) placeholder.hidden = false;
    if (preview) {
        preview.hidden = true;
        preview.removeAttribute('src');
        preview.src = '';
    }
    if (removeBtn) removeBtn.hidden = true;
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
    if (placeholder) placeholder.hidden = true;
    if (preview) {
        preview.src = url;
        preview.hidden = false;
    }
    if (removeBtn) removeBtn.hidden = false;
}

function setupImageUpload() {
    const area = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('p-imagen-file');
    const hiddenInput = document.getElementById('p-imagen');
    const removeBtn = document.getElementById('image-remove-btn');
    if (!area || !fileInput) return;

    area.addEventListener('click', (e) => {
        if (e.target.closest('#image-remove-btn')) return;
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
        e.preventDefault();
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
    const activos = productos.filter((p) => p.activo).length;
    const line = document.getElementById('admin-inventory-line');
    if (line) {
        line.textContent = total
            ? `${total} en lista · ${activos} a la venta · ${stock} und. en nevera`
            : 'No llegó inventario. ¿El API está en localhost:3000 y tu usuario es admin?';
    }
    const setStat = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val);
    };
    setStat('stat-total', total);
    setStat('stat-activos', activos);
    setStat('stat-stock', stock);
    setStat('stat-selected', selectedIds.size);
}

function populateCategoryFilter(productos) {
    const select = document.getElementById('admin-filter-cat');
    if (!select) return;
    const current = select.value;
    const cats = [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todas las categorías</option>'
        + cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if (current && cats.includes(current)) select.value = current;
}

function compareProducts(a, b, key) {
    if (key === 'precio' || key === 'stock' || key === 'id') {
        const diff = Number(a[key] || 0) - Number(b[key] || 0);
        return sortDir === 'asc' ? diff : -diff;
    }
    if (key === 'activo') {
        const diff = Number(Boolean(a.activo)) - Number(Boolean(b.activo));
        return sortDir === 'asc' ? diff : -diff;
    }
    const va = String(a[key] || '').toLowerCase();
    const vb = String(b[key] || '').toLowerCase();
    const cmp = va.localeCompare(vb, 'es');
    return sortDir === 'asc' ? cmp : -cmp;
}

function getVisibleProducts() {
    const q = (document.getElementById('admin-search')?.value || '').trim().toLowerCase();
    const cat = document.getElementById('admin-filter-cat')?.value || '';
    const status = document.getElementById('admin-filter-status')?.value || '';

    let list = allAdminProducts.filter((p) => {
        const matchQ = !q
            || String(p.nombre || '').toLowerCase().includes(q)
            || String(p.categoria || '').toLowerCase().includes(q)
            || String(p.id).includes(q);
        const matchCat = !cat || p.categoria === cat;
        const matchStatus = !status
            || (status === 'active' && p.activo)
            || (status === 'inactive' && !p.activo);
        return matchQ && matchCat && matchStatus;
    });

    list = [...list].sort((a, b) => compareProducts(a, b, sortKey));
    return list;
}

function updateSortHeaders() {
    document.querySelectorAll('.admin-sheet th.sortable').forEach((th) => {
        const key = th.dataset.sort;
        const active = key === sortKey;
        th.classList.toggle('is-sorted', active);
        th.dataset.dir = active ? sortDir : '';
    });
}

function updateBulkButtons() {
    const has = selectedIds.size > 0;
    const btnOff = document.getElementById('btn-bulk-deactivate');
    const btnOn = document.getElementById('btn-bulk-activate');
    if (btnOff) btnOff.disabled = !has;
    if (btnOn) btnOn.disabled = !has;
    const stat = document.getElementById('stat-selected');
    if (stat) stat.textContent = String(selectedIds.size);
}

function syncSelectAllCheckbox(visible) {
    const allBox = document.getElementById('admin-select-all');
    if (!allBox) return;
    const ids = visible.map((p) => p.id);
    const selectedVisible = ids.filter((id) => selectedIds.has(id));
    allBox.checked = ids.length > 0 && selectedVisible.length === ids.length;
    allBox.indeterminate = selectedVisible.length > 0 && selectedVisible.length < ids.length;
}

function exportProductsCsv(productos) {
    const rows = productos.length ? productos : getVisibleProducts();
    const header = ['ID', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Estado', 'Letrero', 'Descuento'];
    const lines = rows.map((p) => [
        p.id,
        `"${String(p.nombre || '').replace(/"/g, '""')}"`,
        `"${String(p.categoria || '').replace(/"/g, '""')}"`,
        Number(p.precio || 0),
        Number(p.stock || 0),
        p.activo ? 'Activo' : 'Inactivo',
        `"${String(p.letrero || '').replace(/"/g, '""')}"`,
        Number(p.descuento || 0)
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yoguraso-inventario-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exportados ${rows.length} productos`, 'success');
}

async function setProductoActivo(producto, activo) {
    const token = getToken();
    if (activo) {
        const payload = {
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio: Number(producto.precio || 0),
            stock: Number(producto.stock || 0),
            imagen_url: producto.imagen_url || '',
            categoria: producto.categoria || 'Yogur',
            activo: true
        };
        return updateProduct(producto.id, payload, token);
    }
    return deleteProduct(producto.id, token);
}

function renderRows(productos) {
    const lista = document.getElementById('admin-productos-lista');
    if (!lista) return;

    updateSortHeaders();
    syncSelectAllCheckbox(productos);
    updateBulkButtons();

    if (!productos.length) {
        lista.innerHTML = '<tr><td colspan="9" class="admin-sheet-empty">No hay productos para mostrar con estos filtros.</td></tr>';
        return;
    }

    lista.innerHTML = productos.map((p) => `
        <tr class="${p.activo ? '' : 'is-row-inactive'}${selectedIds.has(p.id) ? ' is-row-selected' : ''}" data-id="${escapeHtml(p.id)}">
            <td class="col-check"><input type="checkbox" class="row-select" data-id="${escapeHtml(p.id)}" ${selectedIds.has(p.id) ? 'checked' : ''} aria-label="Seleccionar ${escapeHtml(p.nombre)}"></td>
            <td><span class="admin-id">#${escapeHtml(p.id)}</span></td>
            <td>
                <div class="admin-product-cell">
                    ${p.imagen_url
                        ? `<img src="${escapeHtml(p.imagen_url)}" alt="" class="admin-thumb" onerror="this.style.display='none'">`
                        : '<span class="admin-thumb placeholder" aria-hidden="true"><i class="fas fa-image"></i></span>'}
                    <strong>${escapeHtml(p.nombre)}</strong>
                </div>
            </td>
            <td><span class="admin-chip">${escapeHtml(p.categoria || 'Yogur')}</span></td>
            <td class="admin-price">$${Number(p.precio || 0).toLocaleString('es-CO')}</td>
            <td><span class="admin-stock">${escapeHtml(p.stock || 0)} <small>und</small></span></td>
            <td><span class="status-pill ${p.activo ? 'is-active' : 'is-inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>${p.letrero ? `<span class="admin-chip">${escapeHtml(p.letrero)}</span>` : '—'}</td>
            <td class="admin-actions">
                <button type="button" class="btn-edit" data-id="${escapeHtml(p.id)}">Editar</button>
                <button type="button" class="${p.activo ? 'btn-delete' : 'btn-activate'}" data-id="${escapeHtml(p.id)}" data-activo="${p.activo ? '1' : '0'}">
                    ${p.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button type="button" class="btn-delete-permanent" data-id="${escapeHtml(p.id)}" aria-label="Eliminar ${escapeHtml(p.nombre)} definitivamente" title="Eliminar definitivamente">Eliminar</button>
            </td>
        </tr>
    `).join('');

    lista.querySelectorAll('.row-select').forEach((box) => {
        box.addEventListener('change', () => {
            const id = Number(box.dataset.id);
            if (box.checked) selectedIds.add(id);
            else selectedIds.delete(id);
            box.closest('tr')?.classList.toggle('is-row-selected', box.checked);
            syncSelectAllCheckbox(productos);
            updateBulkButtons();
        });
    });

    lista.querySelectorAll('.btn-edit').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const producto = allAdminProducts.find((item) => item.id === id);
            if (!producto) return;
            editandoId = id;
            llenarFormulario(producto);
            abrirModal('Editar producto', { isEdit: true });
        });
    });

    lista.querySelectorAll('.btn-delete, .btn-activate').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const producto = allAdminProducts.find((item) => String(item.id) === String(id));
            if (!producto) return;

            const activar = !producto.activo;
            const ok = confirmAction
                ? await confirmAction({
                    title: activar ? 'Activar producto' : 'Desactivar producto',
                    message: activar
                        ? `¿Activar "${producto.nombre}"? Volverá a verse en el catálogo.`
                        : `¿Desactivar "${producto.nombre}"? Quedará oculto del catálogo (puedes activarlo después).`,
                    confirmText: activar ? 'Sí, activar' : 'Sí, desactivar',
                    cancelText: 'Cancelar',
                    danger: !activar,
                    type: activar ? 'success' : 'warning'
                })
                : window.confirm(activar ? '¿Activar producto?' : '¿Desactivar producto?');

            if (!ok) return;

            btn.disabled = true;
            const res = await setProductoActivo(producto, activar);
            btn.disabled = false;

            if (!res.success) {
                toast(res.message || 'No se pudo actualizar', 'error');
                return;
            }
            toast(activar ? 'Producto activado' : 'Producto desactivado', 'success');
            await cargarTablaProductos();
        });
    });

    lista.querySelectorAll('.btn-delete-permanent').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            const producto = allAdminProducts.find((item) => item.id === id);
            if (!producto) return;

            const ok = confirmAction
                ? await confirmAction({
                    title: 'Eliminar producto definitivamente',
                    message: `¿Eliminar "${producto.nombre}" del catálogo? Esta acción no se puede deshacer. También quitará el producto de los carritos guardados; el historial de pedidos conservará su detalle.`,
                    confirmText: 'Eliminar definitivamente',
                    cancelText: 'Conservar producto',
                    danger: true,
                    type: 'danger'
                })
                : window.confirm(`¿Eliminar "${producto.nombre}" definitivamente? Esta acción no se puede deshacer.`);

            if (!ok) return;

            btn.disabled = true;
            const result = await permanentlyDeleteProduct(id, getToken());
            btn.disabled = false;

            if (!result.success) {
                toast(result.message || 'No se pudo eliminar el producto', 'error');
                return;
            }

            selectedIds.delete(id);
            toast('Producto eliminado definitivamente', 'success');
            await cargarTablaProductos();
        });
    });
}

let allAdminUsers = [];

function getVisibleUsers() {
    const q = (document.getElementById('admin-user-search')?.value || '').trim().toLowerCase();
    if (!q) return allAdminUsers;
    return allAdminUsers.filter((u) => {
        const name = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
        return name.includes(q) || String(u.email || '').toLowerCase().includes(q) || String(u.id).includes(q);
    });
}

function renderUserRows(users) {
    const lista = document.getElementById('admin-usuarios-lista');
    if (!lista) return;

    if (!users.length) {
        lista.innerHTML = '<tr><td colspan="6" class="admin-sheet-empty">No hay usuarios que coincidan con la búsqueda.</td></tr>';
        return;
    }

    const yo = getUsuario();
    lista.innerHTML = users.map((u) => `
        <tr class="${u.activo ? '' : 'is-row-inactive'}">
            <td><span class="admin-id">#${escapeHtml(u.id)}</span></td>
            <td><strong>${escapeHtml(`${u.nombre || ''} ${u.apellido || ''}`.trim())}</strong></td>
            <td class="admin-email">${escapeHtml(u.email || '')}</td>
            <td><span class="admin-chip admin-chip-role">${escapeHtml(u.rol || '')}</span></td>
            <td><span class="status-pill ${u.activo ? 'is-active' : 'is-inactive'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td class="admin-actions">
                <button type="button" class="${u.activo ? 'btn-delete' : 'btn-activate'} btn-toggle-user" data-id="${escapeHtml(u.id)}" ${yo?.id === u.id ? 'disabled' : ''}>
                    ${u.activo ? 'Desactivar' : 'Activar'}
                </button>
            </td>
        </tr>
    `).join('');

    lista.querySelectorAll('.btn-toggle-user').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const resToggle = await toggleUserActive(id, getToken());
            if (!resToggle.success) {
                toast(resToggle.message || 'No se pudo actualizar', 'error');
                return;
            }
            toast(resToggle.message || 'Usuario actualizado', 'success');
            await cargarTablaUsuarios();
        });
    });
}

async function cargarTablaUsuarios() {
    const lista = document.getElementById('admin-usuarios-lista');
    if (!lista) return;

    const res = await fetchUsers(getToken());
    if (!res.success) {
        lista.innerHTML = `<tr><td colspan="6" class="admin-sheet-empty">${escapeHtml(res.message || 'No se pudieron cargar usuarios')}</td></tr>`;
        return;
    }

    allAdminUsers = res.users || [];
    renderUserRows(getVisibleUsers());
}

function payloadDesdeFormulario() {
    const categoriaKey = document.getElementById('p-categoria')?.value || 'natural';
    const letrero = document.getElementById('p-letrero')?.value.trim() || '';
    const tipoLetrero = document.getElementById('p-letrero-tipo')?.value || '';
    return {
        nombre: document.getElementById('p-nombre')?.value.trim(),
        precio: Number(document.getElementById('p-precio')?.value || 0),
        stock: Number(document.getElementById('p-stock')?.value || 0),
        descripcion: document.getElementById('p-descripcion')?.value.trim() || '',
        imagen_url: document.getElementById('p-imagen')?.value.trim() || '',
        categoria: categoriaMap[categoriaKey] || 'Natural',
        color_fondo: document.getElementById('p-color-fondo')?.value || '#FFF8F4',
        activo: Boolean(document.getElementById('p-activo')?.checked),
        letrero,
        letrero_tipo: letrero ? tipoLetrero : '',
        descuento: Number(document.getElementById('p-descuento')?.value || 0)
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
    const colorFondo = document.getElementById('p-color-fondo');
    if (colorFondo) colorFondo.value = /^#[0-9A-Fa-f]{6}$/.test(producto.color_fondo || '') ? producto.color_fondo : '#FFF8F4';
    document.getElementById('p-activo').checked = Boolean(producto.activo);
    const tipo = document.getElementById('p-letrero-tipo');
    const texto = document.getElementById('p-letrero');
    const desc = document.getElementById('p-descuento');
    if (tipo) tipo.value = producto.letrero_tipo || '';
    if (texto) texto.value = producto.letrero || '';
    if (desc) desc.value = producto.descuento || 0;
    const box = document.querySelector('.admin-promo-box');
    if (box) box.open = true;
    syncPromoPreview();
}

async function bulkSetActive(activo) {
    const ids = [...selectedIds];
    if (!ids.length) return;

    const label = activo ? 'activar' : 'desactivar';
    const ok = confirmAction
        ? await confirmAction({
            title: activo ? 'Activar selección' : 'Desactivar selección',
            message: `¿${activo ? 'Activar' : 'Desactivar'} ${ids.length} producto(s)?`,
            confirmText: `Sí, ${label}`,
            cancelText: 'Cancelar',
            danger: !activo,
            type: activo ? 'success' : 'warning'
        })
        : window.confirm(`¿${activo ? 'Activar' : 'Desactivar'} ${ids.length} producto(s)?`);

    if (!ok) return;

    let done = 0;
    for (const id of ids) {
        const producto = allAdminProducts.find((p) => p.id === id);
        if (!producto) continue;
        const res = await setProductoActivo(producto, activo);
        if (res.success) done += 1;
    }

    selectedIds.clear();
    toast(`${done} producto(s) ${activo ? 'activados' : 'desactivados'}`, 'success');
    await cargarTablaProductos();
}

async function cargarTablaProductos() {
    const lista = document.getElementById('admin-productos-lista');
    allAdminProducts = await fetchProducts(true, getToken());
    if (allAdminProducts._error) {
        updateDashboard([]);
        if (lista) {
            lista.innerHTML = `<tr><td colspan="9" class="admin-sheet-empty">${escapeHtml(allAdminProducts._error)}. Arranca el backend en el puerto 3000 y recarga.</td></tr>`;
        }
        return;
    }
    populateCategoryFilter(allAdminProducts);
    updateDashboard(allAdminProducts);
    renderRows(getVisibleProducts());
}

function setupAdminEvents() {
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    const modal = document.getElementById('modal-producto');
    const form = document.getElementById('form-producto');
    const search = document.getElementById('admin-search');

    document.getElementById('btn-reload-users')?.addEventListener('click', () => cargarTablaUsuarios());
    document.getElementById('admin-user-search')?.addEventListener('input', () => renderUserRows(getVisibleUsers()));
    document.getElementById('admin-filter-cat')?.addEventListener('change', () => renderRows(getVisibleProducts()));
    document.getElementById('admin-filter-status')?.addEventListener('change', () => renderRows(getVisibleProducts()));
    document.getElementById('btn-export-csv')?.addEventListener('click', () => exportProductsCsv(getVisibleProducts()));
    document.getElementById('btn-bulk-deactivate')?.addEventListener('click', () => bulkSetActive(false));
    document.getElementById('btn-bulk-activate')?.addEventListener('click', () => bulkSetActive(true));

    document.getElementById('admin-select-all')?.addEventListener('change', (e) => {
        const checked = e.target.checked;
        getVisibleProducts().forEach((p) => {
            if (checked) selectedIds.add(p.id);
            else selectedIds.delete(p.id);
        });
        renderRows(getVisibleProducts());
    });

    document.querySelectorAll('.admin-sheet th.sortable').forEach((th) => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (!key) return;
            if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            else {
                sortKey = key;
                sortDir = 'asc';
            }
            renderRows(getVisibleProducts());
        });
    });

    search?.addEventListener('input', () => renderRows(getVisibleProducts()));

    btnNuevo?.addEventListener('click', () => {
        limpiarFormulario();
        abrirModal('Nuevo producto', { isEdit: false });
        syncPromoPreview();
    });

    setupPromoControls();

    const close = () => cerrarModal({ reset: true });
    btnCerrar?.addEventListener('click', close);
    btnCancelar?.addEventListener('click', close);

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') {
            close();
        }
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (guardando) return;

        const token = getToken();
        const submitBtn = document.getElementById('btn-guardar-producto');
        syncPromoPreview();
        const payload = payloadDesdeFormulario();

        if (!payload.nombre) {
            toast('El nombre es requerido', 'error');
            document.getElementById('p-nombre')?.focus();
            return;
        }
        if (!Number.isFinite(payload.precio) || payload.precio < 0) {
            toast('Ingresa un precio válido', 'error');
            document.getElementById('p-precio')?.focus();
            return;
        }
        if (!Number.isInteger(payload.stock) || payload.stock < 0) {
            toast('Ingresa un stock válido (entero)', 'error');
            document.getElementById('p-stock')?.focus();
            return;
        }

        guardando = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }

        try {
            const uploadResult = await uploadPendingImage(token);
            if (!uploadResult.success) {
                toast(uploadResult.message || 'No se pudo subir la imagen', 'error');
                return;
            }

            payload.imagen_url = uploadResult.url;

            const res = editandoId
                ? await updateProduct(editandoId, payload, token)
                : await createProduct(payload, token);

            if (!res.success) {
                toast(res.message || 'No se pudo guardar el producto', 'error');
                return;
            }

            toast(editandoId ? 'Producto actualizado' : 'Producto creado', 'success');
            cerrarModal({ reset: true });
            await cargarTablaProductos();
        } finally {
            guardando = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                setSubmitLabel(Boolean(editandoId));
            }
        }
    });
}

function setupAdminSubnav() {
    const links = [...document.querySelectorAll('.admin-subnav-link')];
    if (!links.length) return;

    const sync = () => {
        const hash = (window.location.hash || '#productos').toLowerCase();
        links.forEach((a) => {
            const href = (a.getAttribute('href') || '').toLowerCase();
            a.classList.toggle('is-on', href === hash);
        });
    };

    links.forEach((a) => a.addEventListener('click', () => {
        links.forEach((el) => el.classList.remove('is-on'));
        a.classList.add('is-on');
    }));
    window.addEventListener('hashchange', sync);
    sync();
}

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = getUsuario();
    const token = getToken();

    if (!token || !usuario || usuario.rol !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    setupAdminSubnav();
    setupImageUpload();
    setupAdminEvents();
    await cargarTablaProductos();
    await cargarTablaUsuarios();
    window.Cart?.updateCounter();
});
