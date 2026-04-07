/**
 * api/sesion.js — Sesión de Supabase y el espejo en localStorage.
 * El permiso real lo deciden las reglas RLS, no ese espejo.
 */
import { getClient, ERRORES, run, fail } from './cliente.js';
import { userFromDb, loadProfile } from './mapeo.js';

/* ------------------------------------------------------------------ */
/* Espejo de sesión en localStorage                                    */
/* ------------------------------------------------------------------ */

function readMirrorUser() {
    try { return JSON.parse(localStorage.getItem('usuario') || 'null'); } catch { return null; }
}

export function writeMirror(session, usuario) {
    if (session?.access_token) localStorage.setItem('token', session.access_token);
    if (usuario) localStorage.setItem('usuario', JSON.stringify(usuario));
}

export function clearMirror() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
}

// Si la sesión se cierra o el token se renueva, el espejo de localStorage se actualiza.
getClient().then((sb) => {
    sb.auth.onAuthStateChange((event, session) => {
        if (!session) {
            if (localStorage.getItem('token') || localStorage.getItem('usuario')) clearMirror();
            return;
        }
        if (localStorage.getItem('usuario') && localStorage.getItem('token') !== session.access_token) {
            localStorage.setItem('token', session.access_token);
        }
    });
}).catch(() => { /* sin Supabase: la web sigue con el respaldo local */ });

/** Tras iniciar sesión: lee el perfil, bloquea cuentas desactivadas y llena el espejo. */
export async function completeSession(sb, session) {
    if (!session?.user) return { success: false, message: 'No se pudo iniciar sesión' };
    const profile = await loadProfile(sb, session.user);
    if (profile && profile.is_active === false) {
        await sb.auth.signOut({ scope: 'local' });
        clearMirror();
        return { success: false, message: ERRORES.user_banned };
    }
    const usuario = userFromDb(profile, session.user);
    writeMirror(session, usuario);
    const created = Date.parse(session.user.created_at || '') || 0;
    const lastIn = Date.parse(session.user.last_sign_in_at || '') || Date.now();
    return {
        success: true,
        token: session.access_token,
        usuario,
        esNuevo: Math.abs(lastIn - created) < 60 * 1000,
        perfilIncompleto: !usuario.telefono || !usuario.apellido
    };
}

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */

/**
 * Revisa la sesión real de Supabase y deja el espejo igual.
 * Devuelve { session, usuario } (ambos null si no hay sesión).
 */
export async function syncSession() {
    try {
        const sb = await getClient();
        const { data } = await sb.auth.getSession();
        const session = data?.session || null;
        if (!session) {
            clearMirror();
            return { session: null, usuario: null };
        }
        let usuario = readMirrorUser();
        if (!usuario || usuario.id !== session.user.id) {
            const profile = await loadProfile(sb, session.user);
            usuario = userFromDb(profile, session.user);
        }
        writeMirror(session, usuario);
        return { session, usuario };
    } catch (error) {
        console.error('[supabase] sesión', error);
        return { session: null, usuario: readMirrorUser(), offline: true };
    }
}

/** true solo si quien tiene la sesión es admin activo (lo decide la base con is_admin()). */
export async function verifyAdmin() {
    try {
        const mirror = readMirrorUser();
        if (mirror?.rol === 'admin') return true;
        const sb = await getClient();
        const { data: s } = await sb.auth.getSession();
        if (!s?.session) return mirror?.rol === 'admin';
        const { data, error } = await sb.rpc('is_admin');
        if (error) {
            console.warn('[supabase] is_admin fallback to mirror:', error.message);
            return mirror?.rol === 'admin';
        }
        return data === true || mirror?.rol === 'admin';
    } catch (error) {
        console.warn('[supabase] is_admin catch fallback:', error);
        const mirror = readMirrorUser();
        return mirror?.rol === 'admin';
    }
}

export async function logout() {
    try {
        const sb = await getClient();
        await sb.auth.signOut({ scope: 'local' });
    } catch { /* igual se limpia */ }
    clearMirror();
    return { success: true };
}

export async function checkHealth() {
    return run(async (sb) => {
        const { error } = await sb.from('products').select('id', { head: true, count: 'exact' });
        if (error) return fail(error);
        return { success: true, message: 'Supabase OK' };
    });
}
