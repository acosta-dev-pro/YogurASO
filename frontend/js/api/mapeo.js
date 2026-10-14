/**
 * api/mapeo.js — Pasa las columnas de la base (inglés) a los campos de la pantalla (español).
 * name → nombre, price → precio, flavor → sabor. Al guardar, hace el camino inverso.
 */
export function productFromDb(r) {
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

export function productToDb(p = {}) {
    const row = {};
    const has = (k) => Object.prototype.hasOwnProperty.call(p, k);
    if (has('nombre')) row.name = String(p.nombre || '').trim();
    if (has('descripcion')) row.description = p.descripcion || null;
    if (has('precio')) row.price = Number(p.precio || 0);
    if (has('stock')) row.stock = Math.trunc(Number(p.stock || 0));
    if (has('imagen_url')) row.image_url = cleanImageUrl(p.imagen_url);
    if (has('categoria') && p.categoria) row.category = p.categoria;
    if (has('color_fondo') && /^#[0-9A-Fa-f]{6}$/.test(String(p.color_fondo || ''))) row.background_color = p.color_fondo;
    if (has('color_acento')) row.accent_color = /^#[0-9A-Fa-f]{6}$/.test(String(p.color_acento || '')) ? p.color_acento : null;
    if (has('activo')) row.is_active = Boolean(p.activo);
    if (has('letrero')) row.badge_text = String(p.letrero || '').trim() || null;
    if (has('letrero_tipo')) row.badge_type = p.letrero_tipo || null;
    if (row.badge_text == null && has('letrero')) row.badge_type = null;
    if (has('descuento')) row.discount_percent = Math.max(0, Math.min(80, Math.trunc(Number(p.descuento || 0))));
    return row;
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
