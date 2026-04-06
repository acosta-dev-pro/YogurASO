/**
 * api/mapeo.js — Traduce entre las columnas de Supabase (inglés) y los campos de la web (español).
 * Garantiza que tipos de datos, colores hexadecimales y tipos de letrero cumplan las restricciones SQL.
 */

/** Convierte una fila de public.products (Supabase) al objeto de producto que usa la interfaz. */
export function productFromDb(r) {
    if (!r) return null;
    // En la base de datos 'destacado' representa los letreros personalizados del panel
    const rawBadgeType = r.badge_type || '';
    const letreroTipo = rawBadgeType === 'destacado' ? 'personalizado' : rawBadgeType;

    return {
        id: r.id,
        slug: r.slug || '',
        sabor: r.flavor || r.slug || '',
        nombre: r.name || '',
        descripcion: r.description || '',
        descripcion_corta: r.short_description || '',
        precio: Number(r.price || 0),
        precio_1l: Number(r.price_1l || 0),
        stock: Number.isFinite(Number(r.stock)) ? Math.max(0, Math.trunc(Number(r.stock))) : 0,
        volumen: r.volume || '500 ml & 1 Litro',
        imagen_url: r.image_url || '',
        color_fondo: r.background_color || '#FFF8F4',
        color_acento: r.accent_color || '',
        color_dark: r.color_dark || '',
        categoria: r.category || 'Frutales',
        activo: r.is_active !== false,
        destacado: Boolean(r.is_featured),
        orden: r.sort_order ?? 0,
        letrero: r.badge_text || '',
        letrero_tipo: letreroTipo,
        letrero_forma: r.letrero_forma || 'pill',
        descuento: Number(r.discount_percent || 0),
        created_at: r.created_at,
        updated_at: r.updated_at
    };
}

/** Limpia rutas relativas de imágenes para no guardar prefijos "../" en la base de datos. */
function cleanImageUrl(url) {
    const s = String(url || '').trim();
    if (!s) return null;
    if (/^(https?:|data:|blob:)/i.test(s)) return s;
    return s.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
}

/** Normaliza un código hexadecimal a formato #RRGGBB válido para el CHECK constraint de PostgreSQL. */
function cleanHex(hex, fallback = null) {
    const s = String(hex || '').trim();
    return /^#[0-9A-Fa-f]{6}$/.test(s) ? s.toUpperCase() : fallback;
}

/**
 * Convierte los datos del formulario/panel a las columnas válidas de public.products en Supabase.
 * Nota: la restricción SQL permite badge_type in ('nuevo', 'oferta', 'descuento', 'destacado').
 */
export function productToDb(p = {}) {
    const row = {};
    const has = (k) => Object.prototype.hasOwnProperty.call(p, k);

    if (has('nombre')) row.name = String(p.nombre || '').trim();
    if (has('sabor')) row.flavor = String(p.sabor || '').trim() || null;
    if (has('descripcion')) row.description = String(p.descripcion || '').trim() || null;
    if (has('precio')) row.price = Math.max(0, Number(p.precio || 0));
    if (has('stock')) row.stock = Math.max(0, Math.trunc(Number(p.stock || 0)));
    if (has('imagen_url')) row.image_url = cleanImageUrl(p.imagen_url);
    if (has('categoria') && p.categoria) row.category = String(p.categoria).trim();

    if (has('color_fondo')) {
        const bg = cleanHex(p.color_fondo, '#FFF8F4');
        if (bg) row.background_color = bg;
    }
    if (has('color_acento')) {
        row.accent_color = cleanHex(p.color_acento, null);
    }
    if (has('activo')) {
        row.is_active = Boolean(p.activo);
    }
    if (has('letrero')) {
        row.badge_text = String(p.letrero || '').trim().slice(0, 40) || null;
    }
    if (has('letrero_tipo')) {
        const rawType = String(p.letrero_tipo || '').trim().toLowerCase();
        const mappedType = rawType === 'personalizado' ? 'destacado' : rawType;
        const validTypes = ['nuevo', 'oferta', 'descuento', 'destacado'];
        row.badge_type = validTypes.includes(mappedType) ? mappedType : null;
    }
    if (row.badge_text === null && has('letrero')) {
        row.badge_type = null;
    }
    if (has('descuento')) {
        row.discount_percent = Math.max(0, Math.min(80, Math.trunc(Number(p.descuento || 0))));
    }
    return row;
}

/**
 * Columnas añadidas por la migración 0004 (precio 1 L, color fuerte, forma del letrero).
 * Van aparte de productToDb para poder reintentar sin ellas si la migración aún no se ejecutó
 * en Supabase, sin romper el guardado de productos.
 */
export function productExtrasToDb(p = {}) {
    const row = {};
    const has = (k) => Object.prototype.hasOwnProperty.call(p, k);
    if (has('precio_1l')) row.price_1l = Math.max(0, Number(p.precio_1l || 0));
    if (has('color_dark')) row.color_dark = cleanHex(p.color_dark, null);
    if (has('letrero_forma')) {
        row.letrero_forma = ['pill', 'rounded', 'flag'].includes(p.letrero_forma) ? p.letrero_forma : 'pill';
    }
    return row;
}

/** ¿El error de Supabase indica que una columna aún no existe (migración 0004 pendiente)? */
export function isMissingColumnError(error) {
    const text = `${error?.code || ''} ${error?.message || ''}`;
    return /PGRST204|42703|does not exist|could not find the .* column/i.test(text);
}

export function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `producto-${Date.now()}`;
}

export function userFromDb(profile, authUser) {
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

export async function loadProfile(sb, user) {
    const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return data;
}
