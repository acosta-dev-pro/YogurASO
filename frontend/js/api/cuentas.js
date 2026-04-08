/**
 * api/cuentas.js — Registro, ingreso, Google y contraseñas (Supabase Auth).
 */
import { run, fail, ERRORES, normEmail, normCode, pagesUrl } from './cliente.js';
import { userFromDb, loadProfile } from './mapeo.js';
import { completeSession, writeMirror, clearMirror } from './sesion.js';

/* ------------------------------------------------------------------ */
/* Autenticación                                                       */
/* ------------------------------------------------------------------ */

export async function login(email, password) {
    return run(async (sb) => {
        const { data, error } = await sb.auth.signInWithPassword({ email: normEmail(email), password });
        if (error) return fail(error, 'Credenciales incorrectas');
        return completeSession(sb, data.session);
    });
}

/**
 * Registro. Si el proyecto pide confirmar el correo (lo normal), devuelve
 * { success:true, needsConfirmation:true } y la página pide el código de 6 dígitos.
 */
export async function register({ nombre, apellido, telefono, email: rawEmail, password }) {
    const email = normEmail(rawEmail);
    return run(async (sb) => {
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: pagesUrl('login.html'),
                data: {
                    first_name: nombre || '',
                    last_name: apellido || '',
                    phone: telefono || '',
                    full_name: [nombre, apellido].filter(Boolean).join(' ')
                }
            }
        });
        if (error) return fail(error, 'Error en el registro');
        if (data.session) return completeSession(sb, data.session);
        // Supabase no avisa si el correo ya existe (para no filtrar cuentas):
        // en ese caso devuelve un usuario sin identidades.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            return { success: false, code: 'user_already_exists', message: ERRORES.user_already_exists };
        }
        return {
            success: true,
            needsConfirmation: true,
            email,
            message: `Te enviamos un código a ${email}. Revisa también Spam.`
        };
    }, 'Error en el registro');
}

/**
 * Confirma la cuenta con el código del correo e inicia sesión.
 * Prueba type 'signup' (confirmación de registro) y, si falla, 'email'.
 * Un intento fallido no gasta el código.
 */
export async function verifySignupCode(rawEmail, codigo) {
    const email = normEmail(rawEmail);
    const token = normCode(codigo);
    return run(async (sb) => {
        if (!email) return { success: false, message: 'Falta el correo. Vuelve a escribirlo y pide un código nuevo.' };
        let res = await sb.auth.verifyOtp({ email, token, type: 'signup' });
        if (res.error) {
            const retry = await sb.auth.verifyOtp({ email, token, type: 'email' });
            if (!retry.error) res = retry;
        }
        if (res.error) {
            const out = fail(res.error, 'Código inválido o vencido');
            if (out.code === 'otp_expired' || /venció|no es válido/i.test(out.message)) {
                out.message = 'Ese código no sirve o ya venció. Usa el último código que llegó (cada "Reenviar" anula el anterior). Si ya confirmaste tu cuenta, inicia sesión.';
            }
            return out;
        }
        return completeSession(sb, res.data.session);
    });
}

export async function resendSignupCode(rawEmail) {
    const email = normEmail(rawEmail);
    return run(async (sb) => {
        const { error } = await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: pagesUrl('login.html') } });
        if (error) return fail(error, 'No se pudo reenviar el código');
        return { success: true, message: `Te enviamos un código nuevo a ${email}.` };
    });
}

export async function getProfile() {
    return run(async (sb) => {
        const { data: s } = await sb.auth.getSession();
        const session = s?.session;
        if (!session) return { success: false, status: 401, message: 'Inicia sesión para ver tu perfil' };
        const { data: u } = await sb.auth.getUser();
        const user = u?.user || session.user;
        const profile = await loadProfile(sb, user);
        const usuario = userFromDb(profile, user);
        writeMirror(session, usuario);
        return { success: true, usuario };
    }, 'No se pudo cargar el perfil');
}

export async function updateProfile(payload) {
    return run(async (sb) => {
        const { data: s } = await sb.auth.getSession();
        const user = s?.session?.user;
        if (!user) return { success: false, status: 401, message: 'Inicia sesión de nuevo' };
        const row = {};
        if (payload.nombre !== undefined) row.first_name = String(payload.nombre || '').trim();
        if (payload.apellido !== undefined) row.last_name = String(payload.apellido || '').trim();
        if (payload.telefono !== undefined) row.phone = String(payload.telefono || '').trim() || null;
        const { data, error } = await sb.from('profiles').update(row).eq('id', user.id).select().single();
        if (error) return fail(error, 'No se pudo actualizar');
        const usuario = userFromDb(data, user);
        writeMirror(s.session, usuario);
        return { success: true, usuario, message: 'Perfil actualizado' };
    }, 'No se pudo actualizar');
}

/** Paso 1 de recuperar: Supabase manda el código (plantilla Reset Password). */
export async function requestPasswordReset(rawEmail) {
    const email = normEmail(rawEmail);
    return run(async (sb) => {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: pagesUrl('reset-password.html') });
        if (error) return fail(error, 'No se pudo enviar el código');
        return {
            success: true,
            message: 'Si el correo está registrado, te enviamos un código. Revisa también Spam.'
        };
    });
}

/**
 * Paso final de recuperar: valida el código (type 'recovery'), guarda la clave
 * nueva y cierra la sesión temporal. Sin código, usa la sesión de recuperación
 * que ya exista (por ejemplo, si se entró desde un enlace).
 */
export async function resetPassword({ email, codigo, password }) {
    return run(async (sb) => {
        if (codigo) {
            const { error } = await sb.auth.verifyOtp({ email: normEmail(email), token: normCode(codigo), type: 'recovery' });
            if (error) return fail(error, 'Código inválido o vencido');
        } else {
            const { data: s } = await sb.auth.getSession();
            if (!s?.session) return { success: false, message: 'Pide un código nuevo desde "Recuperar contraseña".' };
        }
        const { error: upErr } = await sb.auth.updateUser({ password });
        if (upErr) return fail(upErr, 'No se pudo guardar la contraseña');
        await sb.auth.signOut({ scope: 'local' });
        clearMirror();
        return { success: true, message: 'Contraseña actualizada' };
    });
}

export async function loginWithGoogle(credential, nonce) {
    return run(async (sb) => {
        const opts = { provider: 'google', token: credential };
        if (nonce) opts.nonce = nonce;
        const { data, error } = await sb.auth.signInWithIdToken(opts);
        if (error) return fail(error, 'No se pudo iniciar sesión con Google.');
        return completeSession(sb, data.session);
    });
}

/** Respaldo: Google por redirección (si el botón oficial no carga). */
export async function loginWithGoogleRedirect() {
    return run(async (sb) => {
        const { error } = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: pagesUrl('login.html') }
        });
        if (error) return fail(error, 'No se pudo abrir Google');
        return { success: true };
    });
}

/** Perfil: pide el código para cambiar la clave (plantilla Reauthentication). */
export async function requestPasswordChangeCode() {
    return run(async (sb) => {
        const { error } = await sb.auth.reauthenticate();
        if (error) return fail(error, 'No se pudo enviar el código');
        return { success: true, message: 'Te enviamos un código a tu correo.' };
    });
}

/**
 * Cambia la clave. Con código: updateUser({ password, nonce }).
 * Sin código: comprueba la clave actual iniciando sesión y luego la cambia.
 */
export async function changePassword(passwordActual, passwordNueva, _token = null, codigo = null) {
    return run(async (sb) => {
        if (codigo) {
            const { error } = await sb.auth.updateUser({ password: passwordNueva, nonce: normCode(codigo) });
            if (error) return fail(error, 'No se pudo cambiar la contraseña');
            return { success: true, message: 'Contraseña actualizada' };
        }
        const { data: s } = await sb.auth.getSession();
        const email = s?.session?.user?.email;
        if (!email) return { success: false, status: 401, message: 'Inicia sesión de nuevo' };
        const { error: loginErr } = await sb.auth.signInWithPassword({ email, password: passwordActual });
        if (loginErr) return { success: false, message: 'La contraseña actual no es correcta' };
        const { error } = await sb.auth.updateUser({ password: passwordNueva });
        if (error) return fail(error, 'No se pudo cambiar la contraseña');
        return { success: true, message: 'Contraseña actualizada' };
    });
}

/**
 * Elimina la cuenta de quien tiene la sesión abierta (Edge Function account-admin, que usa service_role).
 * Sus pedidos quedan en la tienda sin dueño; su perfil se borra.
 */
export async function deleteMyAccount() {
    return run(async (sb) => {
        const { error } = await sb.functions.invoke('account-admin', { body: { action: 'delete_self' } });
        if (error) {
            let message = '';
            try { message = (await error.context?.json())?.message || ''; } catch { /* sin detalle */ }
            return { success: false, message: message || 'No se pudo eliminar la cuenta. Intenta de nuevo.' };
        }
        try { await sb.auth.signOut({ scope: 'local' }); } catch { /* la cuenta ya no existe */ }
        clearMirror();
        return { success: true };
    }, 'No se pudo eliminar la cuenta');
}
