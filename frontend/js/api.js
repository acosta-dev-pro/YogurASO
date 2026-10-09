/**
 * api.js — Capa de datos del frontend, ahora sobre Supabase (sin Express).
 * Mantiene los mismos nombres de función y las mismas respuestas que usaba la
 * web con el backend viejo ({ success, message, ... }) y traduce las columnas
 * en inglés de la base (name, price, ...) a los campos en español que usa la
 * interfaz (nombre, precio, ...).
 *
 * Sesión: la guarda supabase-js en el navegador. Para que el resto de la web
 * (que lee localStorage de forma síncrona) siga funcionando, aquí se mantiene
 * un espejo: localStorage.token = access token de Supabase y
 * localStorage.usuario = perfil en español. El permiso real lo deciden las
 * reglas RLS de Supabase, no ese espejo.
 *
 * supabase-js se importa de forma diferida: si el CDN o Supabase fallan, las
 * páginas siguen cargando y main.js usa el catálogo local de respaldo.
 */

const BUCKET = 'product-images';
const isInPages = window.location.pathname.includes('/pages/');

let clientPromise = null;
function getClient() {
    if (!clientPromise) {
        clientPromise = import('./supabase-client.js')
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

const ERRORES = {
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
    PGRST116: 'No se encontró el registro o no tienes permiso.'
};

function traducir(error, fallback = 'Algo salió mal. Intenta de nuevo.') {
    if (!error) return fallback;
    const code = error.code || error.error_code || '';
    if (code && ERRORES[code]) return ERRORES[code];
    const msg = String(error.message || error || '');
    if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
        return 'Sin conexión con el servidor. Revisa tu internet.';
    }
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

function fail(error, fallback) {
    return {
        success: false,
        message: traducir(error, fallback),
        code: error?.code || error?.error_code || undefined,
        status: error?.status
    };
}

/** Ejecuta fn(cliente) y convierte cualquier excepción en { success:false }. */
async function run(fn, fallback) {
    try {
        const sb = await getClient();
        return await fn(sb);
    } catch (error) {
        console.error('[supabase]', error);
        return fail(error, fallback);
    }
}

/** Correo tal como lo guarda Supabase (sin espacios, en minúsculas). */
const normEmail = (e) => String(e || '').trim().toLowerCase();
/** Código del correo: solo dígitos (Supabase manda 6 a 10 según "Email OTP length"). */
const normCode = (c) => String(c || '').replace(/\D/g, '');

function pagesUrl(file) {
    const base = new URL(isInPages ? './' : 'pages/', window.location.href);
    return new URL(file, base).href;
}

/* ------------------------------------------------------------------ */
/* Espejo de sesión en localStorage                                    */
/* ------------------------------------------------------------------ */

function readMirrorUser() {
    try { return JSON.parse(localStorage.getItem('usuario') || 'null'); } catch { return null; }
}

function writeMirror(session, usuario) {
    if (session?.access_token) localStorage.setItem('token', session.access_token);
    if (usuario) localStorage.setItem('usuario', JSON.stringify(usuario));
}

function clearMirror() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
}

// Mantiene el espejo al día (token renovado, cierre de sesión en otra pestaña,
// o sesión vieja del backend Express que ya no existe en Supabase).
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

/* ------------------------------------------------------------------ */
/* Mapeos base de datos (inglés) <-> interfaz (español)                */
/* ------------------------------------------------------------------ */

function productFromDb(r) {
    if (!r) return null;
    return {
        id: r.id,
        slug: r.slug,
        sabor: r.flavor || '',
        nombre: r.name,
        descripcion: r.description || '',
        descripcion_corta: r.short_description || '',
        precio: Number(r.price || 0),
        stock: Number(r.stock || 0),
        volumen: r.volume || '500 ml',
        imagen_url: r.image_url || '',
        color_fondo: r.background_color || '',
        color_acento: r.accent_color || '',
        categoria: r.category || '',
        activo: Boolean(r.is_active),
        destacado: Boolean(r.is_featured),
        orden: r.sort_order,
        letrero: r.badge_text || '',
        letrero_tipo: r.badge_type || '',
        descuento: Number(r.discount_percent || 0),
        created_at: r.created_at,
        updated_at: r.updated_at
    };
}

/** Guarda rutas del sitio sin el "../" que agregan las páginas internas. */
function cleanImageUrl(url) {
    const s = String(url || '').trim();
    if (!s) return null;
    if (/^(https?:|data:)/i.test(s)) return s;
    return s.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
}

function productToDb(p = {}) {
    const row = {};
    const has = (k) => Object.prototype.hasOwnProperty.call(p, k);
    if (has('nombre')) row.name = String(p.nombre || '').trim();
    if (has('descripcion')) row.description = p.descripcion || null;
    if (has('precio')) row.price = Number(p.precio || 0);
    if (has('stock')) row.stock = Math.trunc(Number(p.stock || 0));
    if (has('imagen_url')) row.image_url = cleanImageUrl(p.imagen_url);
    if (has('categoria') && p.categoria) row.category = p.categoria;
    if (has('color_fondo') && /^#[0-9A-Fa-f]{6}$/.test(String(p.color_fondo || ''))) row.background_color = p.color_fondo;
    if (has('activo')) row.is_active = Boolean(p.activo);
    if (has('letrero')) row.badge_text = String(p.letrero || '').trim() || null;
    if (has('letrero_tipo')) row.badge_type = p.letrero_tipo || null;
    if (row.badge_text == null && has('letrero')) row.badge_type = null;
    if (has('descuento')) row.discount_percent = Math.max(0, Math.min(80, Math.trunc(Number(p.descuento || 0))));
    return row;
}

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `producto-${Date.now()}`;
}

function userFromDb(profile, authUser) {
    const provider = authUser?.app_metadata?.provider || '';
    return {
        id: profile?.id || authUser?.id,
        nombre: profile?.first_name || '',
        apellido: profile?.last_name || '',
        email: profile?.email || authUser?.email || '',
        telefono: profile?.phone || '',
        rol: profile?.role === 'admin' ? 'admin' : 'cliente',
        activo: profile ? Boolean(profile.is_active) : true,
        auth_provider: provider === 'email' || !provider ? 'local' : provider,
        created_at: profile?.created_at
    };
}

async function loadProfile(sb, user) {
    const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return data;
}

/** Tras iniciar sesión: lee el perfil, bloquea cuentas desactivadas y llena el espejo. */
async function completeSession(sb, session) {
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
        const sb = await getClient();
        const { data: s } = await sb.auth.getSession();
        if (!s?.session) return false;
        const { data, error } = await sb.rpc('is_admin');
        if (error) throw error;
        return data === true;
    } catch (error) {
        console.error('[supabase] is_admin', error);
        return false;
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

/* ------------------------------------------------------------------ */
/* Productos                                                           */
/* ------------------------------------------------------------------ */

/**
 * Lista de productos. includeInactive=true solo trae los inactivos si quien
 * consulta es admin (RLS). El segundo parámetro (token) ya no se usa.
 */
export async function fetchProducts(includeInactive = false) {
    try {
        const sb = await getClient();
        let query = sb.from('products').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true });
        if (!includeInactive) query = query.eq('is_active', true);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(productFromDb);
    } catch (error) {
        console.error('Productos:', error);
        const empty = [];
        empty._error = traducir(error, 'No se pudieron cargar los productos');
        empty._status = error?.status;
        return empty;
    }
}

export async function getProduct(id) {
    return run(async (sb) => {
        const isId = /^\d+$/.test(String(id));
        const { data, error } = await sb.from('products').select('*')
            .eq(isId ? 'id' : 'slug', isId ? Number(id) : String(id)).maybeSingle();
        if (error) return fail(error);
        if (!data) return { success: false, status: 404, message: 'Producto no encontrado' };
        return { success: true, product: productFromDb(data) };
    });
}

export async function createProduct(payload) {
    return run(async (sb) => {
        const row = productToDb(payload);
        const base = slugify(payload.slug || payload.nombre);
        for (let i = 0; i < 6; i += 1) {
            row.slug = i === 0 ? base : `${base}-${i + 1}`;
            const { data, error } = await sb.from('products').insert(row).select().single();
            if (!error) return { success: true, product: productFromDb(data), message: 'Producto creado' };
            const slugTaken = error.code === '23505' && /slug/i.test(`${error.message} ${error.details || ''}`);
            if (!slugTaken) return fail(error, 'No se pudo crear el producto');
        }
        return { success: false, message: 'Ya existe un producto con ese nombre' };
    }, 'No se pudo crear el producto');
}

export async function updateProduct(id, payload) {
    return run(async (sb) => {
        const row = productToDb(payload);
        const { data, error } = await sb.from('products').update(row).eq('id', id).select();
        if (error) return fail(error, 'No se pudo actualizar el producto');
        if (!data?.length) return { success: false, message: ERRORES.PGRST116 };
        return { success: true, product: productFromDb(data[0]), message: 'Producto actualizado' };
    }, 'No se pudo actualizar el producto');
}

/** Borrado lógico: deja el producto inactivo (no se ve en la tienda). */
export async function deleteProduct(id) {
    return run(async (sb) => {
        const { data, error } = await sb.from('products').update({ is_active: false }).eq('id', id).select('id');
        if (error) return fail(error, 'No se pudo desactivar el producto');
        if (!data?.length) return { success: false, message: ERRORES.PGRST116 };
        return { success: true, message: 'Producto desactivado' };
    });
}

export async function permanentlyDeleteProduct(id) {
    return run(async (sb) => {
        const { data, error } = await sb.from('products').delete().eq('id', id).select('id');
        if (error) return fail(error, 'No se pudo eliminar el producto');
        if (!data?.length) return { success: false, message: ERRORES.PGRST116 };
        return { success: true, message: 'Producto eliminado' };
    });
}

/** Sube una foto al bucket product-images y devuelve su URL pública. */
export async function uploadImage(file) {
    return run(async (sb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!file || !allowed.includes(file.type)) {
            return { success: false, message: 'Solo se permiten imágenes JPG, PNG, WEBP o GIF' };
        }
        if (file.size > 5 * 1024 * 1024) return { success: false, message: 'La imagen no puede superar 5 MB' };
        const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[file.type];
        const path = `products/img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(path, file, {
            contentType: file.type,
            cacheControl: '31536000',
            upsert: false
        });
        if (error) return fail(error, 'Error al subir la imagen');
        const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
        return { success: true, url: data.publicUrl, path };
    }, 'Error al subir la imagen');
}

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
 * Activa o desactiva una cuenta (profiles.is_active). La persona desactivada no
 * puede entrar por esta web; para bloquearla también en Supabase Auth hace falta
 * una Edge Function con la clave service_role (pendiente).
 */
export async function toggleUserActive(id) {
    return run(async (sb) => {
        const { data: current, error: readErr } = await sb.from('profiles').select('is_active').eq('id', id).maybeSingle();
        if (readErr) return fail(readErr);
        if (!current) return { success: false, message: ERRORES.PGRST116 };
        const next = !current.is_active;
        const { data, error } = await sb.from('profiles').update({ is_active: next }).eq('id', id).select('id');
        if (error) return fail(error, 'No se pudo actualizar');
        if (!data?.length) return { success: false, message: ERRORES.PGRST116 };
        return { success: true, activo: next, message: next ? 'Usuario activado' : 'Usuario desactivado' };
    }, 'No se pudo actualizar');
}
