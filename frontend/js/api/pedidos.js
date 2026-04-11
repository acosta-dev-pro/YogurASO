/**
 * api/pedidos.js — Guarda el pedido en Supabase (función create_order)
 * antes de abrir WhatsApp. El precio lo recalcula la base.
 */
import { run, fail } from './cliente.js';

/* ------------------------------------------------------------------ */
/* Pedidos (0003_admin_backend.sql → create_order)                     */
/* ------------------------------------------------------------------ */

const ORDER_SIZES = { '500': '500 ml', '1000': '1 L', '2000': '2 L' };

/** Mismo id de visitante que usa interactions.js (likes/preguntas). */
function orderVisitorId() {
    try {
        let id = localStorage.getItem('yog_visitor_id');
        if (!id && crypto.randomUUID) {
            id = crypto.randomUUID();
            localStorage.setItem('yog_visitor_id', id);
        }
        return /^[0-9a-f-]{36}$/i.test(String(id || '')) ? id : null;
    } catch {
        return null;
    }
}

/** Línea del carrito ({ id: "12::1000", tamano, cantidad }) → { product_id, quantity, size }. */
function orderLine(item) {
    const [rawId, sizeId] = String(item?.id ?? '').split('::');
    if (!/^\d+$/.test(rawId)) return null; // "local-fresa" = catálogo de respaldo, sin id real
    const tamano = String(item.tamano || item.presentacion || '').trim();
    const size = Object.values(ORDER_SIZES).includes(tamano) ? tamano : (ORDER_SIZES[sizeId] || '500 ml');
    const quantity = Math.trunc(Number(item.cantidad || 1));
    return { product_id: Number(rawId), quantity, size };
}

/**
 * Registra el pedido en Supabase antes de abrir WhatsApp. El servidor recalcula
 * los precios con la tabla products (no confía en el precio del carrito).
 * items: líneas de cart.js. customer: { name, phone, email, address, city, notes } (opcional).
 * Devuelve { success, order_number, total, subtotal, items } o { success:false, message }.
 */
export async function createOrder(items, customer = {}) {
    const lines = (Array.isArray(items) ? items : []).map(orderLine);
    if (!lines.length) return { success: false, message: 'El carrito está vacío' };
    if (lines.some((l) => !l)) {
        return { success: false, offline: true, message: 'El catálogo está en modo de respaldo; el pedido sigue solo por WhatsApp.' };
    }
    return run(async (sb) => {
        const { data, error } = await sb.rpc('create_order', {
            p_items: lines,
            p_customer: customer || {},
            p_visitor_id: orderVisitorId()
        });
        if (error) return fail(error, 'No se pudo registrar el pedido');
        return {
            success: true,
            id: data?.id,
            order_number: data?.order_number,
            subtotal: Number(data?.subtotal || 0),
            total: Number(data?.total || 0),
            items: data?.items || []
        };
    }, 'No se pudo registrar el pedido');
}
