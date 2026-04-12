/**
 * api/usuarios.js — Listar y activar cuentas desde el panel (tabla profiles).
 */
import { run, fail, ERRORES } from './cliente.js';
import { userFromDb } from './mapeo.js';

/* ------------------------------------------------------------------ */
/* Usuarios (panel admin)                                              */
/* ------------------------------------------------------------------ */

export async function fetchUsers() {
    return run(async (sb) => {
        const { data, error } = await sb.from('profiles')
            .select('id,email,first_name,last_name,phone,role,is_active,created_at')
            .order('created_at', { ascending: false });
        if (error) return fail(error, 'No se pudieron cargar usuarios');
        return { success: true, users: (data || []).map((p) => userFromDb(p, null)) };
    }, 'No se pudieron cargar usuarios');
}

/**
 * Activa o bloquea una cuenta. Lo hace la Edge Function account-admin: cambia profiles.is_active y
 * bloquea (o desbloquea) la cuenta en Supabase Auth. Si la función no responde, se cambia solo el perfil
 * (la persona no entra por esta web) y el mensaje lo avisa.
 */
export async function toggleUserActive(id) {
    return run(async (sb) => {
        const { data: current, error: readErr } = await sb.from('profiles').select('is_active').eq('id', id).maybeSingle();
        if (readErr) return fail(readErr);
        if (!current) return { success: false, message: ERRORES.PGRST116 };
        const next = !current.is_active;
        const { error: fnError } = await sb.functions.invoke('account-admin', { body: { action: 'set_active', user_id: id, active: next } });
        if (!fnError) return { success: true, activo: next, message: next ? 'Usuario activado' : 'Usuario bloqueado' };
        const { data, error } = await sb.from('profiles').update({ is_active: next }).eq('id', id).select('id');
        if (error) return fail(error, 'No se pudo actualizar');
        if (!data?.length) return { success: false, message: ERRORES.PGRST116 };
        return { success: true, activo: next, message: (next ? 'Usuario activado' : 'Usuario desactivado') + ' en la tienda (el bloqueo en Auth no respondió)' };
    }, 'No se pudo actualizar');
}
