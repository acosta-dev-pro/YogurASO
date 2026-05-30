/**
 * admin/inventario.js — Pestaña Inventario: tabla de productos, filtros, orden, selección masiva, exportación CSV y activar/ocultar.
 */
import { state, selectedIds } from './state.js';
import { fetchProducts, updateProduct, deleteProduct, permanentlyDeleteProduct } from '../api.js';
import { imgSrc } from './constants.js';
import { escapeHtml, toast, confirmAction, getToken } from './ui.js';
import { abrirModal, llenarFormulario } from './formulario.js';
import { renderStockAlerts } from './stock.js';
import { renderRealAnalytics } from './tab-usuarios.js';

export function updateDashboard(productos) {
    const total = productos.length;
    const stock = productos.reduce((acc, p) => acc + Number(p.stock || 0), 0);
    const activos = productos.filter((p) => p.activo).length;
    const line = document.getElementById('admin-inventory-line');
    if (line) {
        line.textContent = total
            ? `${total} en lista · ${activos} a la venta · ${stock} und. en nevera`
            : 'No llegó inventario. Revisa tu conexión y que tu usuario sea admin.';
    }
    const setStat = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val);
    };
    setStat('stat-total', total);
    setStat('stat-activos', activos);
    setStat('stat-stock', stock);
    setStat('stat-selected', selectedIds.size);

    renderStockAlerts(productos);
    renderRealAnalytics(productos);
}

export function populateCategoryFilter(productos) {
    const select = document.getElementById('admin-filter-cat');
    if (!select) return;
    const current = select.value;
    const cats = [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todas las categorías</option>'
        + cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if (current && cats.includes(current)) select.value = current;
}

export function compareProducts(a, b, key) {
    if (key === 'precio' || key === 'stock' || key === 'id') {
        const diff = Number(a[key] || 0) - Number(b[key] || 0);
        return state.sortDir === 'asc' ? diff : -diff;
    }
    if (key === 'activo') {
        const diff = Number(Boolean(a.activo)) - Number(Boolean(b.activo));
        return state.sortDir === 'asc' ? diff : -diff;
    }
    const va = String(a[key] || '').toLowerCase();
    const vb = String(b[key] || '').toLowerCase();
    const cmp = va.localeCompare(vb, 'es');
    return state.sortDir === 'asc' ? cmp : -cmp;
}

export function getVisibleProducts() {
    const q = (document.getElementById('admin-search')?.value || '').trim().toLowerCase();
    const cat = document.getElementById('admin-filter-cat')?.value || '';
    const status = document.getElementById('admin-filter-status')?.value || '';

    let list = state.products.filter((p) => {
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

    list = [...list].sort((a, b) => compareProducts(a, b, state.sortKey));
    return list;
}

export function updateSortHeaders() {
    document.querySelectorAll('.admin-sheet th.sortable').forEach((th) => {
        const key = th.dataset.sort;
        const active = key === state.sortKey;
        th.classList.toggle('is-sorted', active);
        th.dataset.dir = active ? state.sortDir : '';
    });
}

export function updateBulkButtons() {
    const has = selectedIds.size > 0;
    const btnOff = document.getElementById('btn-bulk-deactivate');
    const btnOn = document.getElementById('btn-bulk-activate');
    if (btnOff) btnOff.disabled = !has;
    if (btnOn) btnOn.disabled = !has;
    const stat = document.getElementById('stat-selected');
    if (stat) stat.textContent = String(selectedIds.size);
}

export function syncSelectAllCheckbox(visible) {
    const allBox = document.getElementById('admin-select-all');
    if (!allBox) return;
    const ids = visible.map((p) => p.id);
    const selectedVisible = ids.filter((id) => selectedIds.has(id));
    allBox.checked = ids.length > 0 && selectedVisible.length === ids.length;
    allBox.indeterminate = selectedVisible.length > 0 && selectedVisible.length < ids.length;
}

export function exportProductsCsv(productos) {
    const rows = productos.length ? productos : getVisibleProducts();
    const header = ['ID', 'Nombre', 'Categoría', 'Precio 500ml', 'Precio 1L', 'Stock', 'Estado', 'Letrero', 'Descuento'];
    const lines = rows.map((p) => [
        p.id,
        `"${String(p.nombre || '').replace(/"/g, '""')}"`,
        `"${String(p.categoria || '').replace(/"/g, '""')}"`,
        Number(p.precio || 0),
        Number(p.precio_1l || Math.round((Number(p.precio || 0) * 1.75) / 100) * 100),
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

export async function setProductoActivo(producto, activo) {
    if (activo) return updateProduct(producto.id, { activo: true });
    return deleteProduct(producto.id);
}

export function abrirEdicionProductoPorId(rawId) {
    const producto = state.products.find((item) => String(item.id) === String(rawId));
    if (!producto) {
        toast('No se encontró el producto en el catálogo', 'error');
        return;
    }
    state.editandoId = producto.id;
    try {
        llenarFormulario(producto);
    } catch (err) {
        console.error('[admin] Error al llenar formulario:', err);
    }
    abrirModal('Editar producto', { isEdit: true });
}

export function renderRows(productos) {
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
                        ? `<img src="${escapeHtml(imgSrc(p.imagen_url))}" alt="" class="admin-thumb" onerror="this.style.display='none'">`
                        : '<span class="admin-thumb placeholder" aria-hidden="true"><i class="fas fa-image"></i></span>'}
                    <strong>${escapeHtml(p.nombre)}</strong>
                </div>
            </td>
            <td><span class="admin-chip">${escapeHtml(p.categoria || 'Yogur')}</span></td>
            <td class="admin-price">$${Number(p.precio || 0).toLocaleString('es-CO')}</td>
            <td><span class="admin-stock">${escapeHtml(p.stock ?? 0)} <small>und</small></span></td>
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
            const rawId = box.dataset.id;
            const prod = state.products.find((item) => String(item.id) === String(rawId));
            const keyId = prod ? prod.id : Number(rawId);
            if (box.checked) selectedIds.add(keyId);
            else selectedIds.delete(keyId);
            box.closest('tr')?.classList.toggle('is-row-selected', box.checked);
            syncSelectAllCheckbox(productos);
            updateBulkButtons();
        });
    });

    lista.querySelectorAll('.btn-edit').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            abrirEdicionProductoPorId(btn.dataset.id);
        });
    });

    lista.querySelectorAll('.btn-delete, .btn-activate').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const producto = state.products.find((item) => String(item.id) === String(id));
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
            const rawId = btn.dataset.id;
            const producto = state.products.find((item) => String(item.id) === String(rawId));
            if (!producto) return;

            const ok = confirmAction
                ? await confirmAction({
                    title: 'Eliminar producto definitivamente',
                    message: `¿Eliminar "${producto.nombre}" del catálogo? Esta acción no se puede deshacer. También quitará el producto de los carritos guardados.`,
                    confirmText: 'Eliminar definitivamente',
                    cancelText: 'Conservar producto',
                    danger: true,
                    type: 'danger'
                })
                : window.confirm(`¿Eliminar "${producto.nombre}" definitivamente? Esta acción no se puede deshacer.`);

            if (!ok) return;

            btn.disabled = true;
            const result = await permanentlyDeleteProduct(producto.id, getToken());
            btn.disabled = false;

            if (!result.success) {
                toast(result.message || 'No se pudo eliminar el producto', 'error');
                return;
            }

            selectedIds.delete(producto.id);
            toast('Producto eliminado definitivamente', 'success');
            await cargarTablaProductos();
        });
    });
}

export async function bulkSetActive(activo) {
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
        const producto = state.products.find((p) => String(p.id) === String(id));
        if (!producto) continue;
        const res = await setProductoActivo(producto, activo);
        if (res.success) done += 1;
    }

    selectedIds.clear();
    toast(`${done} producto(s) ${activo ? 'activados' : 'desactivados'}`, 'success');
    await cargarTablaProductos();
}

export async function cargarTablaProductos() {
    const lista = document.getElementById('admin-productos-lista');
    state.products = await fetchProducts(true, getToken());
    if (state.products._error) {
        updateDashboard([]);
        if (lista) {
            lista.innerHTML = `<tr><td colspan="9" class="admin-sheet-empty">${escapeHtml(state.products._error)}. Revisa tu conexión y recarga.</td></tr>`;
        }
        return;
    }
    populateCategoryFilter(state.products);
    updateDashboard(state.products);
    renderRows(getVisibleProducts());
}
