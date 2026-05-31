/**
 * admin/stock.js — Alertas de stock y reabastecimiento calculadas con el stock real de cada producto.
 */
import { state } from './state.js';
import { updateProduct } from '../api.js';
import { imgSrc } from './constants.js';
import { escapeHtml, toast, formatCOP, getToken } from './ui.js';
import { abrirEdicionProductoPorId, cargarTablaProductos } from './inventario.js';

/**
 * Clasifica el estado real del inventario de un producto según sus unidades disponibles:
 * - 0 und       -> Agotado (Crítico)
 * - 1 a 10 und  -> Stock crítico (Requiere producción inmediata)
 * - 11 a 25 und -> Stock preventivo (Programar lote en planta)
 * - > 25 und    -> Stock óptimo (Abastecido en nevera)
 */
export function clasificarEstadoStock(stock, activo) {
    const n = Number(stock || 0);
    if (!activo) {
        return {
            badgeClass: 'stock-low',
            statusLabel: 'Pausado en catálogo · Stock en nevera',
            isLow: false
        };
    }
    if (n <= 0) {
        return {
            badgeClass: 'stock-warning',
            statusLabel: 'Agotado · Requiere producción inmediata',
            isLow: true
        };
    }
    if (n <= 10) {
        return {
            badgeClass: 'stock-warning',
            statusLabel: 'Stock crítico · Preparar lote urgente',
            isLow: true
        };
    }
    if (n <= 20) {
        return {
            badgeClass: 'stock-low',
            statusLabel: 'Stock preventivo · Programar reabastecimiento',
            isLow: true
        };
    }
    return {
        badgeClass: 'stock-ok',
        statusLabel: 'Stock óptimo · Lote fresco disponible en nevera',
        isLow: false
    };
}

/**
 * Renderiza la tabla de Alertas de Stock y Reabastecimiento con los datos 100% reales
 * de `state.products`.
 */
export function renderStockAlerts(productos = state.products) {
    const tbody = document.getElementById('admin-alertas-lista');
    const subtitle = document.getElementById('admin-alerts-subtitle');
    const filterEl = document.getElementById('admin-alerts-filter');
    if (!tbody) return;

    const list = Array.isArray(productos) ? [...productos] : [];
    const filterMode = filterEl?.value || 'all';

    // Ordenar de menor a mayor stock para priorizar los que tienen menos unidades
    list.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

    const lowCount = list.filter((p) => Number(p.stock || 0) <= 20).length;
    const totalUnits = list.reduce((acc, p) => acc + Number(p.stock || 0), 0);

    if (subtitle) {
        subtitle.textContent = lowCount > 0
            ? `${lowCount} sabor(es) con stock ≤ 20 und · ${totalUnits} unidades reales en total`
            : `Todos los ${list.length} sabores tienen abastecimiento óptimo (${totalUnits} unidades disponibles en total).`;
    }

    const filtered = filterMode === 'low'
        ? list.filter((p) => Number(p.stock || 0) <= 20)
        : list;

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="admin-sheet-empty">
                    ${filterMode === 'low'
                        ? '¡Excelente! Ningún sabor tiene stock bajo (todos superan las 20 unidades disponibles).'
                        : 'No hay productos registrados en el inventario.'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map((p) => {
        const stockNum = Number(p.stock ?? 0);
        const info = clasificarEstadoStock(stockNum, p.activo);
        const p1L = Number(p.precio_1l || 0) || Math.round((Number(p.precio || 0) * 1.75) / 100) * 100;
        const presText = `500 ml (${formatCOP(p.precio)}) & 1 Litro (${formatCOP(p1L)})`;

        return `
            <tr data-alert-id="${escapeHtml(p.id)}">
                <td>
                    <div class="admin-product-cell">
                        ${p.imagen_url
                            ? `<img src="${escapeHtml(imgSrc(p.imagen_url))}" alt="" class="admin-thumb" onerror="this.style.display='none'">`
                            : '<span class="admin-thumb placeholder" aria-hidden="true"><i class="fas fa-wine-bottle"></i></span>'}
                        <div>
                            <strong>Yogur ${escapeHtml(p.nombre)}</strong>
                            <div style="font-size: 11.5px; color: #706B66;">#${escapeHtml(p.id)} · ${escapeHtml(p.categoria || 'Artesanal')}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(presText)}</td>
                <td>
                    <span class="stock-badge ${info.badgeClass}">
                        ${stockNum} ${stockNum === 1 ? 'unidad' : 'unidades'}
                    </span>
                </td>
                <td>${escapeHtml(info.statusLabel)}</td>
                <td>
                    <div class="admin-alerts-actions">
                        <button type="button" class="btn btn-secondary btn-sm btn-restock-quick" data-id="${escapeHtml(p.id)}" data-add="10" title="Sumar 10 unidades al stock real">
                            +10 und
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm btn-restock-quick" data-id="${escapeHtml(p.id)}" data-add="25" title="Sumar 25 unidades al stock real">
                            +25 und
                        </button>
                        <button type="button" class="btn-edit btn-restock-edit" data-id="${escapeHtml(p.id)}" title="Editar stock exacto">
                            Editar stock
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Acciones rápidas para sumar unidades reales al inventario
    tbody.querySelectorAll('.btn-restock-quick').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const rawId = btn.dataset.id;
            const delta = Number(btn.dataset.add || 0);
            const prod = state.products.find((item) => String(item.id) === String(rawId));
            if (!prod || !delta) return;

            const nuevoStock = Math.max(0, Number(prod.stock || 0) + delta);
            btn.disabled = true;
            const res = await updateProduct(prod.id, { stock: nuevoStock }, getToken());
            btn.disabled = false;

            if (!res.success) {
                toast(res.message || 'No se pudo actualizar el stock', 'error');
                return;
            }

            toast(`Stock de ${prod.nombre} actualizado: ${nuevoStock} unidades disponibles`, 'success');
            await cargarTablaProductos();
        });
    });

    // Botón para abrir el modal de edición directamente enfocado en el campo de stock
    tbody.querySelectorAll('.btn-restock-edit').forEach((btn) => {
        btn.addEventListener('click', () => {
            abrirEdicionProductoPorId(btn.dataset.id);
            setTimeout(() => {
                const stockInput = document.getElementById('p-stock');
                stockInput?.focus();
                stockInput?.select?.();
            }, 80);
        });
    });
}
