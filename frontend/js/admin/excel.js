/**
 * admin/excel.js — Exportar a Excel (.xlsx) con SheetJS desde su CDN oficial.
 * Si la librería no carga (sin internet), baja el inventario en CSV como antes.
 */
import { colorsFor, salePrice, STATUS_Q, STATUS_O, fmtDate } from './shared.js';

const SHEETJS = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

function inventoryRows(products) {
    return products.map((p) => {
        const c = colorsFor(p);
        return {
            ID: p.id,
            Nombre: p.nombre || '',
            Categoría: p.categoria || '',
            'Precio (COP)': Number(p.precio || 0),
            'Descuento (%)': Number(p.descuento || 0),
            'Precio en tienda (COP)': salePrice(p),
            Stock: Number(p.stock || 0),
            Estado: p.activo ? 'A la venta' : 'Oculto',
            Letrero: p.letrero || '',
            'Color fondo': c.fondo,
            'Color fuerte': c.fuerte,
            Foto: p.imagen_url || '',
            Actualizado: fmtDate(p.updated_at)
        };
    });
}

function questionRows(questions) {
    return questions.map((q) => ({
        ID: q.id,
        Fecha: fmtDate(q.created_at),
        Nombre: q.author_name || 'Sin nombre',
        Pregunta: q.body || '',
        Estado: STATUS_Q[q.status] || q.status || '',
        Respuesta: q.answer || ''
    }));
}

function orderRows(orders) {
    return orders.map((o) => ({
        Pedido: o.order_number || o.id,
        Fecha: fmtDate(o.created_at),
        Cliente: o.shipping_name || '',
        Teléfono: o.shipping_phone || '',
        Ciudad: o.city || '',
        Productos: (o.order_items || []).map((i) => `${i.quantity} × ${i.product_name}`).join(', '),
        'Total (COP)': Number(o.total || 0),
        Estado: STATUS_O[o.status] || o.status || '',
        Pago: o.payment_status || ''
    }));
}

function csvFallback(products) {
    const rows = inventoryRows(products);
    const header = Object.keys(rows[0] || { ID: '' });
    const cell = (v) => (typeof v === 'number' ? String(v) : `"${String(v ?? '').replace(/"/g, '""')}"`);
    const csv = [header.join(','), ...rows.map((r) => header.map((h) => cell(r[h])).join(','))].join('\n');
    download(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), 'csv');
}

function stamp() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

function download(blob, ext) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yoguraso-panel-${stamp()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Libro con una hoja por tema. Solo agrega Preguntas y Pedidos si hay datos.
 * Devuelve { format: 'xlsx' | 'csv', sheets }.
 */
export async function exportWorkbook({ products = [], questions = [], orders = [] }) {
    let XLSX;
    try {
        XLSX = await import(SHEETJS);
    } catch {
        csvFallback(products);
        return { format: 'csv', sheets: 1 };
    }
    const wb = XLSX.utils.book_new();
    const add = (rows, name, widths) => {
        const ws = XLSX.utils.json_to_sheet(rows);
        if (widths) ws['!cols'] = widths.map((wch) => ({ wch }));
        XLSX.utils.book_append_sheet(wb, ws, name);
    };
    add(inventoryRows(products), 'Inventario', [6, 24, 14, 12, 12, 18, 8, 12, 14, 12, 12, 40, 20]);
    if (questions.length) add(questionRows(questions), 'Preguntas', [6, 20, 18, 60, 12, 60]);
    if (orders.length) add(orderRows(orders), 'Pedidos', [14, 20, 22, 14, 14, 50, 12, 12, 12]);
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'xlsx');
    return { format: 'xlsx', sheets: wb.SheetNames.length };
}
