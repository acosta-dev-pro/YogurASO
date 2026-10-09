/**
 * admin/data.js — Datos extra del panel (solo admin).
 * Preguntas del FAQ, me gusta de la web, pedidos y colores por producto.
 *
 * No reemplaza a api.js: productos, fotos y usuarios siguen saliendo de ahí.
 * Usa el mismo cliente de Supabase (js/supabase-client.js, clave pública);
 * los permisos reales los ponen las reglas RLS de la base.
 *
 * Cada función devuelve { success, ... } y, si falta algo en la base,
 * { success:false, needs:'<qué falta>' } para que el panel lo diga claro.
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

const MISSING_TABLE = /42P01|PGRST205|does not exist|could not find the table/i;
const MISSING_COLUMN = /42703|PGRST204|column .* does not exist|could not find the .* column/i;
const MISSING_FN = /PGRST202|could not find the function/i;

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

/**
 * Lista las preguntas. Pide también answer/answered_at; si esas columnas
 * no existen todavía, repite sin ellas y avisa con canAnswer:false.
 */
export async function listQuestions() {
    try {
        const sb = await client();
        let canAnswer = true;
        let res = await sb.from('faq_questions')
            .select('id,author_name,body,status,created_at,answer,answered_at')
            .order('created_at', { ascending: false })
            .limit(300);
        if (res.error && MISSING_COLUMN.test(errText(res.error))) {
            canAnswer = false;
            res = await sb.from('faq_questions')
                .select('id,author_name,body,status,created_at')
                .order('created_at', { ascending: false })
                .limit(300);
        }
        if (res.error) {
            if (MISSING_TABLE.test(errText(res.error))) {
                return { success: false, needs: 'tabla', message: 'La tabla de preguntas aún no existe en Supabase.' };
            }
            return fail(res.error, 'No se pudieron cargar las preguntas');
        }
        return { success: true, questions: res.data || [], canAnswer };
    } catch (error) {
        return fail(error, 'No se pudieron cargar las preguntas');
    }
}

async function updateQuestion(id, row, fallback) {
    try {
        const sb = await client();
        const { data, error } = await sb.from('faq_questions').update(row).eq('id', id).select('id');
        if (error) {
            if (MISSING_COLUMN.test(errText(error))) {
                return { success: false, needs: 'columna', message: 'Falta la columna de respuesta en la tabla de preguntas.' };
            }
            return fail(error, fallback);
        }
        if (!data?.length) {
            return { success: false, needs: 'permiso', message: 'Supabase no dejó guardar: falta el permiso de admin para editar preguntas.' };
        }
        return { success: true };
    } catch (error) {
        return fail(error, fallback);
    }
}

export function setQuestionStatus(id, status) {
    return updateQuestion(id, { status }, 'No se pudo cambiar el estado');
}

export function answerQuestion(id, answer, { publish = true } = {}) {
    const row = { answer: String(answer || '').trim() || null, answered_at: answer ? new Date().toISOString() : null };
    if (publish) row.status = 'approved';
    return updateQuestion(id, row, 'No se pudo guardar la respuesta');
}

/* ------------------------------------------------------------------ */
/* Me gusta de la web (content_likes vía like_state, migración 0002)    */
/* ------------------------------------------------------------------ */

// like_state pide un visitante; el panel usa uno propio solo para leer el conteo.
const ADMIN_VISITOR = '00000000-0000-4000-8000-00000000ad01';

export async function likeCounts(targets) {
    try {
        const sb = await client();
        const out = [];
        for (const t of targets) {
            const { data, error } = await sb.rpc('like_state', {
                p_target_type: t.type,
                p_target_id: String(t.id),
                p_visitor_id: ADMIN_VISITOR
            });
            if (error) {
                if (MISSING_FN.test(errText(error)) || MISSING_TABLE.test(errText(error))) {
                    return { success: false, needs: 'tabla', message: 'Los me gusta aún no están en Supabase (migración 0002).' };
                }
                return fail(error, 'No se pudieron leer los me gusta');
            }
            const row = Array.isArray(data) ? data[0] : data;
            out.push({ ...t, likes: Number(row?.likes || 0) });
        }
        return { success: true, items: out };
    } catch (error) {
        return fail(error, 'No se pudieron leer los me gusta');
    }
}

/* ------------------------------------------------------------------ */
/* Pedidos (tablas orders y order_items, migración 0001)               */
/* ------------------------------------------------------------------ */

export async function listOrders() {
    try {
        const sb = await client();
        const { data, error } = await sb.from('orders')
            .select('id,order_number,status,shipping_name,shipping_phone,shipping_email,address,city,subtotal,shipping_cost,total,payment_method,payment_status,created_at,order_items(product_name,quantity,unit_price,subtotal)')
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) {
            if (MISSING_TABLE.test(errText(error))) {
                return { success: false, needs: 'tabla', message: 'La tabla de pedidos no existe en Supabase.' };
            }
            return fail(error, 'No se pudieron cargar los pedidos');
        }
        return { success: true, orders: data || [] };
    } catch (error) {
        return fail(error, 'No se pudieron cargar los pedidos');
    }
}

export async function setOrderStatus(id, status) {
    try {
        const sb = await client();
        const { data, error } = await sb.from('orders').update({ status }).eq('id', id).select('id');
        if (error) return fail(error, 'No se pudo cambiar el estado');
        if (!data?.length) return { success: false, needs: 'permiso', message: 'Supabase no dejó guardar el estado del pedido.' };
        return { success: true };
    } catch (error) {
        return fail(error, 'No se pudo cambiar el estado');
    }
}

/* ------------------------------------------------------------------ */
/* Colores por producto                                                */
/* ------------------------------------------------------------------ */
// El pastel (color_fondo -> products.background_color) ya lo guarda api.js.
// El fuerte va en products.accent_color, pero productToDb() de api.js todavía
// no lo envía. Mientras tanto se guarda también en este navegador.
// TODO(backend): mapear color_acento -> accent_color en productToDb (api.js)
// y entonces este respaldo deja de usarse solo.

const COLORS_KEY = 'yog_admin_colores_v1';

export function readLocalColors() {
    try {
        const raw = JSON.parse(localStorage.getItem(COLORS_KEY) || '{}');
        return raw && typeof raw === 'object' ? raw : {};
    } catch {
        return {};
    }
}

export function writeLocalColor(id, colors) {
    const all = readLocalColors();
    if (colors) all[String(id)] = { ...colors, saved_at: new Date().toISOString() };
    else delete all[String(id)];
    try { localStorage.setItem(COLORS_KEY, JSON.stringify(all)); } catch { /* sin espacio */ }
}
