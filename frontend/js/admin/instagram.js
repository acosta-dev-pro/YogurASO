/**
 * admin/instagram.js — Adaptador del post estilo Instagram de la web
 * (sección «Sobre nosotros» del inicio). No es la cuenta real de Instagram:
 * son los me gusta y comentarios que la gente deja en nuestra propia página.
 *
 * Datos (supabase/migrations/0002_interactions.sql):
 *   content_likes     -> conteo con la RPC like_state(target_type, target_id, visitor)
 *   content_comments  -> comentarios del post (target_type = 'post', target_id = 'nosotros')
 *
 * Lo que este archivo necesita y aún no existe en la base (ver docs/admin/PENDIENTES-BACKEND.md):
 *   - policy de admin para leer TODOS los comentarios (hoy solo se ven los aprobados)
 *   - columnas reply / replied_at para la respuesta
 *   - policies de admin para update y delete
 * Si falta algo, cada función responde { success:false, needs } y el panel lo dice.
 */

export const POST_ID = 'nosotros';
const ADMIN_VISITOR = '00000000-0000-4000-8000-00000000ad01'; // solo para leer el conteo

let clientPromise = null;
function client() {
    if (!clientPromise) {
        clientPromise = import('../supabase-client.js')
            .then((m) => m.obtenerSupabase())
            .catch((err) => { clientPromise = null; throw err; });
    }
    return clientPromise;
}

const txt = (e) => `${e?.code || ''} ${e?.message || e || ''}`;
const MISSING_TABLE = /42P01|PGRST205|does not exist|could not find the table/i;
const MISSING_COLUMN = /42703|PGRST204|column .* does not exist|could not find the .* column/i;
const MISSING_FN = /PGRST202|could not find the function/i;

function fail(error, fallback) {
    const t = txt(error);
    if (/failed to fetch|networkerror|load failed/i.test(t)) return { success: false, message: 'Sin conexión con Supabase.' };
    if (MISSING_TABLE.test(t) || MISSING_FN.test(t)) return { success: false, needs: 'tabla', message: 'Las tablas de interacciones aún no están en Supabase (migración 0002).' };
    if (/row-level security|permission denied|42501/i.test(t)) return { success: false, needs: 'permiso', message: 'Supabase no da permiso de admin para esta acción.' };
    return { success: false, message: error?.message || fallback };
}

/** getPostLikes(postId) -> { success, likes } */
export async function getPostLikes(postId = POST_ID) {
    try {
        const sb = await client();
        const { data, error } = await sb.rpc('like_state', { p_target_type: 'post', p_target_id: postId, p_visitor_id: ADMIN_VISITOR });
        if (error) return fail(error, 'No se pudieron leer los me gusta');
        const row = Array.isArray(data) ? data[0] : data;
        return { success: true, likes: Number(row?.likes || 0) };
    } catch (error) {
        return fail(error, 'No se pudieron leer los me gusta');
    }
}

/**
 * listPostComments(postId) -> { success, comments:[{ id, author_name, body, status, created_at, reply, replied_at }], canReply }
 * Si reply/replied_at no existen, repite sin ellas y devuelve canReply:false.
 */
export async function listPostComments(postId = POST_ID) {
    try {
        const sb = await client();
        let canReply = true;
        let res = await sb.from('content_comments')
            .select('id,author_name,body,status,created_at,reply,replied_at')
            .eq('target_type', 'post').eq('target_id', postId)
            .order('created_at', { ascending: false }).limit(300);
        if (res.error && MISSING_COLUMN.test(txt(res.error))) {
            canReply = false;
            res = await sb.from('content_comments')
                .select('id,author_name,body,status,created_at')
                .eq('target_type', 'post').eq('target_id', postId)
                .order('created_at', { ascending: false }).limit(300);
        }
        if (res.error) return fail(res.error, 'No se pudieron cargar los comentarios');
        return { success: true, comments: res.data || [], canReply };
    } catch (error) {
        return fail(error, 'No se pudieron cargar los comentarios');
    }
}

async function updateComment(id, row, fallback) {
    try {
        const sb = await client();
        const { data, error } = await sb.from('content_comments').update(row).eq('id', id).select('id');
        if (error) {
            if (MISSING_COLUMN.test(txt(error))) return { success: false, needs: 'columna', message: 'Falta la columna de respuesta en los comentarios.' };
            return fail(error, fallback);
        }
        if (!data?.length) return { success: false, needs: 'permiso', message: 'Supabase no dejó guardar: falta el permiso de admin para editar comentarios.' };
        return { success: true };
    } catch (error) {
        return fail(error, fallback);
    }
}

/** setCommentStatus(id, 'pending'|'approved'|'hidden') -> { success } */
export function setCommentStatus(id, status) {
    return updateComment(id, { status }, 'No se pudo cambiar el estado');
}

/** replyToComment(id, text) -> { success }  (publica el comentario junto con la respuesta) */
export function replyToComment(id, text) {
    const reply = String(text || '').trim();
    if (!reply) return Promise.resolve({ success: false, message: 'Escribe la respuesta.' });
    return updateComment(id, { reply, replied_at: new Date().toISOString(), status: 'approved' }, 'No se pudo guardar la respuesta');
}

/** deleteComment(id) -> { success } */
export async function deleteComment(id) {
    try {
        const sb = await client();
        const { data, error } = await sb.from('content_comments').delete().eq('id', id).select('id');
        if (error) return fail(error, 'No se pudo borrar el comentario');
        if (!data?.length) return { success: false, needs: 'permiso', message: 'Supabase no dejó borrar: falta el permiso de admin.' };
        return { success: true };
    } catch (error) {
        return fail(error, 'No se pudo borrar el comentario');
    }
}
