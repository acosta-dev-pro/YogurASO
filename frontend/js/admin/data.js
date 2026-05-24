/**
 * Datos extra del panel: preguntas, me gusta, pedidos y colores por producto.
 */

let clientPromise = null;
function client() {
    if (!clientPromise) {
        clientPromise = import('../supabase-client.js')
            .then((m) => m.obtenerSupabase())
            .catch((err) => { clientPromise = null; throw err; });
    }
    return clientPromise;
}

function errText(error) {
    return `${error?.code || ''} ${error?.message || error || ''}`;
}

function fail(error, fallback) {
    const txt = errText(error);
    if (/failed to fetch|networkerror|load failed/i.test(txt)) {
        return { success: false, message: 'Sin conexión con Supabase. Revisa tu internet.' };
    }
    if (/row-level security|permission denied|42501/i.test(txt)) {
        return { success: false, needs: 'permiso', message: 'Supabase no da permiso de admin para esta acción.' };
    }
    return { success: false, message: error?.message || fallback };
}

/* ------------------------------------------------------------------ */
/* Preguntas del FAQ (tabla faq_questions, migración 0002)             */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Me gusta de la web (content_likes vía like_state, migración 0002)    */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Pedidos (tablas orders y order_items, migración 0001)               */
/* ------------------------------------------------------------------ */

/** Cuántos pedidos hay guardados. null si no se pudo contar. */
export async function contarPedidos() {
    try {
        const sb = await client();
        const { count, error } = await sb.from('orders').select('id', { count: 'exact', head: true });
        return error ? null : (count ?? 0);
    } catch {
        return null;
    }
}

/* ------------------------------------------------------------------ */
/* Colores por producto                                                */
/* ------------------------------------------------------------------ */
// Pastel -> products.background_color, fuerte -> products.color_dark (migración 0004).
// Ya se guardan en la base y se ven en todos los dispositivos. Esto queda solo
// como lectura de respaldo de valores viejos guardados en este navegador.

const COLORS_KEY = 'yog_admin_colores_v1';

export function readLocalColors() {
    try {
        const raw = JSON.parse(localStorage.getItem(COLORS_KEY) || '{}');
        return raw && typeof raw === 'object' ? raw : {};
    } catch {
        return {};
    }
}

