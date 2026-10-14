/**
 * api/cliente.js — Conexión con Supabase y traducción de errores.
 * La clave pública vive en supabase-client.js. Aquí no hay secretos.
 */
export const BUCKET = 'product-images';
const isInPages = window.location.pathname.includes('/pages/');

let clientPromise = null;
export function getClient() {
    if (!clientPromise) {
        clientPromise = import('../supabase-client.js')
            .then((m) => m.obtenerSupabase())
            .catch((err) => {
                clientPromise = null;
                throw err;
            });
    }
    return clientPromise;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export const ERRORES = {
    invalid_credentials: 'Correo o contraseña incorrectos',
    email_not_confirmed: 'Tu correo aún no está confirmado. Escribe el código que te enviamos.',
    user_already_exists: 'Ese correo ya está registrado. Inicia sesión o recupera tu contraseña.',
    email_exists: 'Ese correo ya está registrado. Inicia sesión o recupera tu contraseña.',
    weak_password: 'La contraseña es muy débil. Usa al menos 8 caracteres.',
    over_email_send_rate_limit: 'Ya enviamos varios correos. Espera unos minutos y vuelve a intentar.',
    over_request_rate_limit: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
    over_sms_send_rate_limit: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
    otp_expired: 'El código no es válido o ya venció. Pide uno nuevo.',
    otp_disabled: 'Este tipo de código no está habilitado.',
    same_password: 'La nueva contraseña debe ser distinta a la actual.',
    reauthentication_needed: 'Primero pide el código a tu correo.',
    reauthentication_not_valid: 'El código no es válido o ya venció. Pide uno nuevo.',
    email_address_invalid: 'Revisa el correo, parece que no es válido.',
    validation_failed: 'Revisa los datos e intenta de nuevo.',
    signup_disabled: 'El registro está deshabilitado por ahora.',
    user_banned: 'Tu cuenta está desactivada. Escríbenos si crees que es un error.',
    session_not_found: 'Tu sesión expiró. Inicia sesión de nuevo.',
    provider_disabled: 'Este método de inicio de sesión no está habilitado.',
    bad_jwt: 'Tu sesión expiró. Inicia sesión de nuevo.',
    '42501': 'No tienes permiso para esta acción.',
    '23505': 'Ya existe un registro con ese nombre.',
    '23514': 'Algún dato no es válido (precio, stock, color, letrero o descuento).',
    PGRST116: 'No se encontró el registro o no tienes permiso.',
    PGRST202: 'Esta función todavía no está activada en el servidor. Intenta más tarde.',
    PGRST205: 'Esta sección todavía no está activada en el servidor. Intenta más tarde.'
};

export function traducir(error, fallback = 'Algo salió mal. Intenta de nuevo.') {
    if (!error) return fallback;
    const code = error.code || error.error_code || '';
    if (code && ERRORES[code]) return ERRORES[code];
    const msg = String(error.message || error || '');
    if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
        return 'Sin conexión con el servidor. Revisa tu internet.';
    }
    if (/could not find the function/i.test(msg)) return ERRORES.PGRST202;
    if (/could not find the table/i.test(msg)) return ERRORES.PGRST205;
    if (/invalid login credentials/i.test(msg)) return ERRORES.invalid_credentials;
    if (/email not confirmed/i.test(msg)) return ERRORES.email_not_confirmed;
    if (/already registered/i.test(msg)) return ERRORES.user_already_exists;
    if (/token has expired|is invalid/i.test(msg)) return ERRORES.otp_expired;
    if (/rate limit|security purposes/i.test(msg)) return ERRORES.over_request_rate_limit;
    if (/row-level security|permission denied/i.test(msg)) return ERRORES['42501'];
    if (/should be different/i.test(msg)) return ERRORES.same_password;
    if (/password should be at least/i.test(msg)) return ERRORES.weak_password;
    return msg || fallback;
}

export function fail(error, fallback) {
    return {
        success: false,
        message: traducir(error, fallback),
        code: error?.code || error?.error_code || undefined,
        status: error?.status
    };
}

/** Ejecuta fn(cliente) y convierte cualquier excepción en { success:false }. */
export async function run(fn, fallback) {
    try {
        const sb = await getClient();
        return await fn(sb);
    } catch (error) {
        console.error('[supabase]', error);
        return fail(error, fallback);
    }
}

/** Correo tal como lo guarda Supabase (sin espacios, en minúsculas). */
export const normEmail = (e) => String(e || '').trim().toLowerCase();
/** Código del correo: solo dígitos (Supabase manda 6 a 10 según "Email OTP length"). */
export const normCode = (c) => String(c || '').replace(/\D/g, '');

export function pagesUrl(file) {
    const base = new URL(isInPages ? './' : 'pages/', window.location.href);
    return new URL(file, base).href;
}
