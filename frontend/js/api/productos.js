/**
 * api/productos.js — Leer y guardar el catálogo (tabla products y fotos).
 */
import { getClient, run, fail, traducir, ERRORES, BUCKET } from './cliente.js';
import { productFromDb, productToDb, slugify } from './mapeo.js';

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
