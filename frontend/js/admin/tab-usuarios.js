/**
 * admin/tab-usuarios.js — Pestaña Usuarios y analítica: listado, activar/desactivar y métricas reales de visitas e interacciones.
 */
import { state } from './state.js';
import { fetchUsers, toggleUserActive } from '../api.js';
import { escapeHtml, toast, getToken, getUsuario } from './ui.js';

export function getVisibleUsers() {
    const q = (document.getElementById('admin-user-search')?.value || '').trim().toLowerCase();
    if (!q) return state.users;
    return state.users.filter((u) => {
        const name = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
        return name.includes(q) || String(u.email || '').toLowerCase().includes(q) || String(u.id).includes(q);
    });
}

export function renderUserRows(users) {
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
                    ${u.activo ? 'Bloquear' : 'Activar'}
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

export async function cargarTablaUsuarios() {
    const lista = document.getElementById('admin-usuarios-lista');
    if (!lista) return;

    const res = await fetchUsers(getToken());
    if (!res.success) {
        lista.innerHTML = `<tr><td colspan="6" class="admin-sheet-empty">${escapeHtml(res.message || 'No se pudieron cargar usuarios')}</td></tr>`;
        return;
    }

    state.users = res.users || [];
    renderUserRows(getVisibleUsers());
}

export function renderRealAnalytics(productos) {
    if (!window.YogAnalytics) return;
    const metrics = window.YogAnalytics.getMetrics();
    const list = Array.isArray(productos) ? productos : (state.products || []);

    const totalVisits = Number(metrics.totalVisits) || 0;
    const totalOrders = Number(metrics.totalOrders) || 0;
    const productStats = metrics.productClicks || {};

    let totalClicks = 0;
    Object.values(productStats).forEach((p) => {
        totalClicks += (Number(p.clicks) || 0) + (Number(p.inspections) || 0) + (Number(p.cartAdds) || 0);
    });

    const conversion = totalVisits > 0 ? ((totalOrders / totalVisits) * 100).toFixed(1) : '0.0';

    const elVisitas = document.getElementById('analytics-visitas');
    if (elVisitas) elVisitas.textContent = totalVisits.toLocaleString('es-CO');

    const elClicks = document.getElementById('analytics-clicks');
    if (elClicks) elClicks.textContent = totalClicks.toLocaleString('es-CO');

    const elPedidos = document.getElementById('analytics-pedidos');
    if (elPedidos) elPedidos.textContent = totalOrders.toLocaleString('es-CO');

    const elConversion = document.getElementById('analytics-conversion');
    if (elConversion) elConversion.textContent = conversion + '%';

    renderFlavorAnalyticsBars(list, productStats, totalClicks);
}

export function renderFlavorAnalyticsBars(productos, productStats, totalClicks) {
    const container = document.getElementById('admin-flavor-bars');
    const counterEl = document.getElementById('analytics-products-count');
    if (!container) return;

    const mergedMap = new Map();
    (productos || []).forEach((p) => {
        const id = String(p.id);
        const stats = productStats[id] || productStats[p.slug] || {};
        const clicks = (Number(stats.clicks) || 0) + (Number(stats.inspections) || 0) + (Number(stats.cartAdds) || 0);
        mergedMap.set(id, {
            id,
            nombre: p.nombre || ('Producto #' + id),
            clicks,
            color: p.color_acento || 'var(--rojo-marca, #C3343E)'
        });
    });

    const items = Array.from(mergedMap.values()).sort((a, b) => b.clicks - a.clicks);
    if (counterEl) {
        counterEl.textContent = items.length + (items.length === 1 ? ' producto' : ' productos');
    }

    if (!items.length) {
        container.innerHTML = '<p class="admin-empty-state" style="padding: 16px; color: #888;">No hay productos en inventario.</p>';
        return;
    }

    container.innerHTML = items.map((item) => {
        const pct = totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100) : 0;
        const widthStyle = `width: ${Math.max(pct, item.clicks > 0 ? 5 : 0)}%; background: ${item.color};`;
        return `
            <div class="admin-bar-item">
                <div class="admin-bar-label">
                    <span>${escapeHtml(item.nombre)}</span>
                    <strong>${pct}% (${item.clicks} ${item.clicks === 1 ? 'clic' : 'clics'})</strong>
                </div>
                <div class="admin-bar-track">
                    <div class="admin-bar-fill" style="${widthStyle}"></div>
                </div>
            </div>
        `;
    }).join('');
}
