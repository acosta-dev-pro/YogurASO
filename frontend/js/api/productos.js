/**
 * Catálogo de productos: lectura y cambios en Supabase y copia local para la tienda.
 */
import { getClient, run, fail, traducir, ERRORES, BUCKET } from './cliente.js';
import { productFromDb, productToDb, productExtrasToDb, isMissingColumnError, slugify } from './mapeo.js';

export const SYNC_STORAGE_KEY = 'yog_products_sync_v1';

/** Lee el estado sincronizado local (ediciones, productos nuevos, eliminados y metadatos extendidos). */
function readSyncState() {
    try {
        const raw = JSON.parse(localStorage.getItem(SYNC_STORAGE_KEY) || 'null');
        if (raw && typeof raw === 'object') {
            return {
                overrides: raw.overrides && typeof raw.overrides === 'object' ? raw.overrides : {},
                created: Array.isArray(raw.created) ? raw.created : [],
                deletedIds: Array.isArray(raw.deletedIds) ? raw.deletedIds.map(String) : []
            };
        }
    } catch (_) { /* modo privado o JSON inválido */ }
    return { overrides: {}, created: [], deletedIds: [] };
}

/** Guarda el estado sincronizado y notifica a las pestañas/componentes abiertos. */
function writeSyncState(state) {
    try {
        localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify({
            ...state,
            updated_at: new Date().toISOString()
        }));
        window.dispatchEvent(new CustomEvent('yog:catalog-updated'));
    } catch (_) { /* sin espacio */ }
}

/** Registra o actualiza un producto en el espejo de sincronización. */
function saveProductOverride(id, changes) {
    const state = readSyncState();
    const key = String(id);
    // Si estaba en creados localmente, actualizarlo ahí también
    const createdIdx = state.created.findIndex((p) => String(p.id) === key);
    if (createdIdx !== -1) {
        state.created[createdIdx] = {
            ...state.created[createdIdx],
            ...changes,
            updated_at: new Date().toISOString()
        };
    } else {
        state.overrides[key] = {
            ...(state.overrides[key] || {}),
            ...changes,
            updated_at: new Date().toISOString()
        };
    }
    state.deletedIds = state.deletedIds.filter((d) => d !== key);
    writeSyncState(state);
}

/** Campos que dependen de la migración 0004: si la base aún no los tiene, el espejo local los completa. */
const EXTENDED_FIELDS = ['precio_1l', 'color_dark', 'letrero_forma'];

/**
 * Combina la lista de productos de Supabase con los ajustes guardados en el panel.
 * Regla de precedencia (evita pantallas desactualizadas entre dispositivos):
 *  - La base de datos es la fuente de verdad.
 *  - Un ajuste local solo pisa a la base si es MÁS RECIENTE que la fila (p. ej. una edición
 *    que no pudo guardarse por permisos).
 *  - Los campos extendidos solo se toman del espejo mientras la base no los tenga.
 */
function mergeWithSyncState(dbProducts, includeInactive = false) {
    const state = readSyncState();
    const deletedSet = new Set(state.deletedIds.map(String));

    // 1. Filtrar eliminados permanentemente y aplicar overrides a los de la base
    const merged = (dbProducts || [])
        .filter((p) => p && !deletedSet.has(String(p.id)))
        .map((p) => {
            const rawOv = state.overrides[String(p.id)];
            if (!rawOv) return p;
            const ovNewer = !p.updated_at || !rawOv.updated_at || new Date(rawOv.updated_at) >= new Date(p.updated_at);
            const ov = {};
            Object.keys(rawOv).forEach((k) => {
                if (k === 'updated_at') return;
                if (ovNewer || (EXTENDED_FIELDS.includes(k) && !p[k])) ov[k] = rawOv[k];
            });
            return {
                ...p,
                ...ov,
                id: p.id,
                precio: ov.precio !== undefined ? Number(ov.precio) : Number(p.precio || 0),
                precio_1l: ov.precio_1l !== undefined ? Number(ov.precio_1l) : Number(p.precio_1l || 0),
                stock: ov.stock !== undefined ? Math.max(0, Math.trunc(Number(ov.stock))) : Number(p.stock || 0),
                descuento: ov.descuento !== undefined ? Number(ov.descuento) : Number(p.descuento || 0),
                activo: ov.activo !== undefined ? Boolean(ov.activo) : Boolean(p.activo)
            };
        });

    // 2. Agregar productos creados desde el panel que aún no estén en la respuesta de la base
    const existingIds = new Set(merged.map((p) => String(p.id)));
    state.created.forEach((createdProd) => {
        if (createdProd && !deletedSet.has(String(createdProd.id)) && !existingIds.has(String(createdProd.id))) {
            merged.push(createdProd);
        }
    });

    // 3. Filtrar inactivos cuando se consulta desde la tienda pública (includeInactive = false)
    if (!includeInactive) {
        return merged.filter((p) => p.activo !== false);
    }
    return merged;
}

/** Botella genérica para productos sin foto; no depende del nombre que se escriba. */
const DEFAULT_BOTTLE = 'assets/products/yoguraso-fresa-500ml-sm.webp';

/** Comprime una imagen en el navegador para que quepa holgadamente en localStorage sin perder nitidez. */
async function compressImageToDataUrl(file, maxW = 640, maxH = 880, quality = 0.84) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onerror = () => resolve('');
        reader.onload = (ev) => {
            const rawUrl = String(ev.target?.result || '');
            if (!rawUrl) return resolve('');
            const img = new Image();
            img.onerror = () => resolve(rawUrl);
            img.onload = () => {
                try {
                    let w = img.naturalWidth || img.width || maxW;
                    let h = img.naturalHeight || img.height || maxH;
                    if (w > maxW || h > maxH) {
                        const ratio = Math.min(maxW / w, maxH / h);
                        w = Math.max(1, Math.round(w * ratio));
                        h = Math.max(1, Math.round(h * ratio));
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return resolve(rawUrl);
                    ctx.drawImage(img, 0, 0, w, h);
                    let out = canvas.toDataURL('image/webp', quality);
                    if (!out || out.length > rawUrl.length) {
                        out = rawUrl;
                    }
                    resolve(out);
                } catch (_) {
                    resolve(rawUrl);
                }
            };
            img.src = rawUrl;
        };
        reader.readAsDataURL(file);
    });
}

/* ------------------------------------------------------------------ */
/* Operaciones CRUD de Productos                                       */
/* ------------------------------------------------------------------ */

/**
 * Obtiene la lista completa de productos.
 * @param {boolean} includeInactive - true en Admin para ver activos e inactivos; false en la tienda pública.
 */
export async function fetchProducts(includeInactive = false) {
    try {
        const sb = await getClient();
        // Traemos los productos ordenados por sort_order e id
        const { data, error } = await sb
            .from('products')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('id', { ascending: true });

        if (error) throw error;
        const mapped = (data || []).map(productFromDb);
        return mergeWithSyncState(mapped, includeInactive);
    } catch (error) {
        console.error('[api/productos] Error al consultar productos:', error);
        const state = readSyncState();
        if (state.created.length) {
            return mergeWithSyncState([], includeInactive);
        }
        const empty = [];
        empty._error = traducir(error, 'No se pudieron cargar los productos');
        empty._status = error?.status;
        return empty;
    }
}

/** Obtiene un producto individual por ID numérico o slug. */
export async function getProduct(id) {
    return run(async (sb) => {
        const isId = /^\d+$/.test(String(id));
        const { data, error } = await sb
            .from('products')
            .select('*')
            .eq(isId ? 'id' : 'slug', isId ? Number(id) : String(id))
            .maybeSingle();

        if (error) return fail(error);
        if (!data) {
            const state = readSyncState();
            const foundLocal = state.created.find((p) => String(p.id) === String(id) || p.slug === String(id));
            if (foundLocal) return { success: true, product: foundLocal };
            return { success: false, status: 404, message: 'Producto no encontrado' };
        }
        const mapped = mergeWithSyncState([productFromDb(data)], true)[0];
        return { success: true, product: mapped };
    });
}

/** Crea un nuevo producto en Supabase y sincroniza los metadatos extendidos. */
export async function createProduct(payload = {}) {
    return run(async (sb) => {
        const rawSlug = slugify(payload.slug || payload.nombre || 'producto');
        const officialSlugs = ['fresa', 'pina', 'mora', 'melocoton', 'frutos-rojos', 'cafe', 'guanabana', 'mango', 'griego'];
        // Si el slug coincide con uno oficial pero es un producto nuevo, evitar colisión
        const base = officialSlugs.includes(rawSlug) ? `${rawSlug}-${Date.now().toString(36).slice(-4)}` : rawSlug;
        const finalImg = String(payload.imagen_url || '').trim() || DEFAULT_BOTTLE;
        const enrichedPayload = {
            ...payload,
            slug: base,
            imagen_url: finalImg
        };
        const row = { ...productToDb(enrichedPayload), ...productExtrasToDb(enrichedPayload) };

        const extraFields = {
            nombre: String(payload.nombre || '').trim(),
            slug: base,
            precio_1l: Number(payload.precio_1l || 0),
            color_dark: payload.color_dark || '#C3343E',
            color_fondo: payload.color_fondo || '#F4CBCF',
            imagen_url: finalImg,
            letrero_forma: payload.letrero_forma || 'pill',
            is_custom: true
        };

        let lastError = null;
        for (let i = 0; i < 6; i += 1) {
            row.slug = i === 0 ? base : `${base}-${i + 1}`;
            let { data, error } = await sb.from('products').insert(row).select().single();
            // Migración 0004 pendiente: reintentar sin las columnas extendidas (quedan en el espejo local).
            if (error && isMissingColumnError(error)) {
                console.warn('[api/productos] Faltan columnas extendidas; ejecuta supabase/migrations/0004_product_extras.sql');
                delete row.price_1l; delete row.color_dark; delete row.letrero_forma;
                ({ data, error } = await sb.from('products').insert(row).select().single());
            }
            if (!error && data) {
                const created = { ...productFromDb(data), ...extraFields };
                saveProductOverride(created.id, extraFields);
                return { success: true, product: created, message: 'Producto creado exitosamente' };
            }
            lastError = error;
            const slugTaken = error?.code === '23505' && /slug/i.test(`${error.message} ${error.details || ''}`);
            if (!slugTaken) break;
        }

        // Sin respaldo local: un producto que solo existe en este navegador no lo vería nadie más.
        return fail(lastError, 'No se pudo crear el producto en la base de datos. Revisa que hayas iniciado sesión como admin.');
    }, 'No se pudo crear el producto');
}

/** Actualiza cualquier campo de un producto (stock, precio, descuento, colores, estado, etc.). */
export async function updateProduct(id, payload = {}) {
    return run(async (sb) => {
        const row = productToDb(payload);

        // Construir copia limpia de los campos que se están actualizando para el espejo sincronizado
        const syncPatch = {};
        const copyKeys = [
            'nombre', 'sabor', 'slug', 'descripcion', 'precio', 'precio_1l', 'stock',
            'imagen_url', 'categoria', 'color_fondo', 'color_acento', 'color_dark',
            'activo', 'letrero', 'letrero_tipo', 'letrero_forma', 'descuento', 'is_custom'
        ];
        copyKeys.forEach((k) => {
            if (Object.prototype.hasOwnProperty.call(payload, k)) {
                syncPatch[k] = payload[k];
            }
        });

        let dbProduct = null;
        let dbError = null;
        const fullRow = { ...row, ...productExtrasToDb(payload) };
        if (Object.keys(fullRow).length > 0 && /^\d+$/.test(String(id))) {
            let { data, error } = await sb.from('products').update(fullRow).eq('id', Number(id)).select();
            // Migración 0004 pendiente: reintentar solo con las columnas que ya existen.
            if (error && isMissingColumnError(error) && Object.keys(row).length > 0) {
                console.warn('[api/productos] Faltan columnas extendidas; ejecuta supabase/migrations/0004_product_extras.sql');
                ({ data, error } = await sb.from('products').update(row).eq('id', Number(id)).select());
            }
            dbError = error;
            if (!error && data?.length) {
                dbProduct = productFromDb(data[0]);
            } else if (!error) {
                // RLS rechaza el UPDATE sin error: 0 filas modificadas = sesión sin rol admin.
                dbError = { message: 'Supabase no dejó guardar: inicia sesión con la cuenta admin.' };
            }
        }

        // Si la base no guardó, NO se simula éxito: el cambio solo existiría en este navegador
        // y el resto de visitantes (celulares) seguiría viendo lo anterior.
        if (!dbProduct) {
            return {
                success: false,
                message: dbError?.message
                    ? `No se guardó en la base: ${traducir(dbError, dbError.message)}`
                    : 'No se guardó en la base de datos'
            };
        }

        saveProductOverride(id, syncPatch);
        return {
            success: true,
            product: { ...dbProduct, ...syncPatch },
            message: 'Producto actualizado correctamente'
        };
    }, 'No se pudo actualizar el producto');
}

/** Borrado lógico: desactiva el producto para ocultarlo de la tienda pública sin perder su historial. */
export async function deleteProduct(id) {
    return updateProduct(id, { activo: false });
}

/** Eliminación definitiva del producto del catálogo. */
export async function permanentlyDeleteProduct(id) {
    return run(async (sb) => {
        const key = String(id);
        if (/^\d+$/.test(key)) {
            const { data, error } = await sb.from('products').delete().eq('id', Number(key)).select('id');
            if (error) return fail(error, 'No se pudo eliminar el producto de la base de datos');
            if (!data?.length) {
                // Sin rol admin, RLS responde 0 filas sin error.
                const { data: sigue } = await sb.from('products').select('id').eq('id', Number(key)).maybeSingle();
                if (sigue) return { success: false, message: 'La base no dejó eliminarlo: inicia sesión con la cuenta admin.' };
            }
        }
        const state = readSyncState();
        delete state.overrides[key];
        state.created = state.created.filter((p) => String(p.id) !== key);
        state.deletedIds = state.deletedIds.filter((d) => d !== key);
        writeSyncState(state);
        return { success: true, message: 'Producto eliminado definitivamente' };
    }, 'No se pudo eliminar el producto');
}

/** Sube una foto al bucket product-images en Supabase Storage o genera Data URL comprimido de respaldo. */
export async function uploadImage(file) {
    return run(async (sb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!file || !allowed.includes(file.type)) {
            return { success: false, message: 'Solo se permiten imágenes JPG, PNG, WEBP o GIF' };
        }
        if (file.size > 5 * 1024 * 1024) {
            return { success: false, message: 'La imagen no puede superar 5 MB' };
        }
        const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[file.type];
        const path = `products/img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(path, file, {
            contentType: file.type,
            cacheControl: '31536000',
            upsert: false
        });
        if (!error) {
            const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
            return { success: true, url: data.publicUrl, path };
        }
        // Si el bucket no tiene permisos de subida en entorno local, comprimir a DataURL ligero para no bloquear al admin ni llenar localStorage
        const dataUrl = await compressImageToDataUrl(file);
        if (dataUrl) {
            return { success: true, url: dataUrl, path: 'local-data-url' };
        }
        return fail(error, 'Error al subir la imagen');
    }, 'Error al subir la imagen');
}
