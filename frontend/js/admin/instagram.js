/**
 * admin/instagram.js — Adaptador de Instagram para el panel.
 *
 * Instagram solo entrega me gusta y comentarios, y deja responder, por la
 * Instagram Graph API: cuenta Business o Creator, una app de Meta y un token
 * de acceso de larga duración. Ese token NUNCA va en el navegador.
 *
 * Por eso aquí no hay token: todo pasa por una Edge Function de Supabase
 * llamada "instagram" que guarda el token como secreto, comprueba que quien
 * llama es admin (is_admin) y habla con graph.instagram.com / graph.facebook.com.
 *
 * Contrato que espera este archivo (POST, body JSON):
 *   { action: 'status' }                       -> { connected, username, name, profile_picture_url, followers_count, media_count }
 *   { action: 'media', limit }                 -> { posts: [{ id, caption, media_type, media_url, thumbnail_url, permalink, timestamp, like_count, comments_count }] }
 *   { action: 'comments', mediaId }            -> { comments: [{ id, text, username, timestamp, like_count, replies: [{ id, text, username, timestamp }] }] }
 *   { action: 'reply', commentId, message }    -> { id }
 * Errores: { error: '<texto>' } con status 4xx/5xx.
 *
 * Mientras la función no exista o no tenga token, el panel muestra
 * "Conecta tu cuenta de Instagram..." y no inventa nada.
 */

const FN = 'instagram';

let clientPromise = null;
function client() {
    if (!clientPromise) {
        clientPromise = import('../supabase-client.js')
            .then((m) => m.obtenerSupabase())
            .catch((err) => { clientPromise = null; throw err; });
    }
    return clientPromise;
}

async function call(body) {
    let sb;
    try {
        sb = await client();
    } catch (error) {
        return { ok: false, reason: 'offline', message: 'Sin conexión con Supabase.' };
    }
    if (!sb.functions?.invoke) return { ok: false, reason: 'sin-funcion' };
    try {
        const { data, error } = await sb.functions.invoke(FN, { body });
        if (error) {
            const status = error.context?.status || error.status || 0;
            let detail = '';
            try { detail = (await error.context?.json?.())?.error || ''; } catch { /* sin cuerpo */ }
            if (status === 404 || /relay|not found|failed to send/i.test(`${error.name} ${error.message}`)) {
                return { ok: false, reason: 'sin-funcion' };
            }
            if (status === 401 || status === 403) return { ok: false, reason: 'permiso', message: detail || 'Solo un admin puede ver Instagram.' };
            if (/token/i.test(detail)) return { ok: false, reason: 'sin-token', message: detail };
            return { ok: false, reason: 'error', message: detail || error.message || 'Instagram no respondió.' };
        }
        if (data?.error) {
            return { ok: false, reason: /token|not configured|sin configurar/i.test(data.error) ? 'sin-token' : 'error', message: data.error };
        }
        return { ok: true, data: data || {} };
    } catch (error) {
        return { ok: false, reason: 'error', message: error?.message || 'Instagram no respondió.' };
    }
}

/** Estado de la conexión: { connected, account? , reason?, message? } */
export async function instagramStatus() {
    const res = await call({ action: 'status' });
    if (!res.ok) return { connected: false, reason: res.reason, message: res.message };
    if (!res.data.connected) return { connected: false, reason: 'sin-token', message: res.data.message };
    return { connected: true, account: res.data };
}

export async function listMedia(limit = 12) {
    const res = await call({ action: 'media', limit });
    if (!res.ok) return { success: false, reason: res.reason, message: res.message };
    return { success: true, posts: Array.isArray(res.data.posts) ? res.data.posts : [] };
}

export async function listComments(mediaId) {
    const res = await call({ action: 'comments', mediaId });
    if (!res.ok) return { success: false, reason: res.reason, message: res.message };
    return { success: true, comments: Array.isArray(res.data.comments) ? res.data.comments : [] };
}

export async function replyToComment(commentId, message) {
    const text = String(message || '').trim();
    if (!text) return { success: false, message: 'Escribe la respuesta.' };
    const res = await call({ action: 'reply', commentId, message: text });
    if (!res.ok) return { success: false, reason: res.reason, message: res.message || 'No se pudo responder.' };
    return { success: true, id: res.data.id };
}
