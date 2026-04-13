/**
 * Ajustes del sitio guardados en Supabase (tabla site_settings).
 */
import { getClient, run, fail, traducir } from './cliente.js';

export const SITE_MEDIA_BUCKET = 'site-media';
const MEDIA_MAX_BYTES = 50 * 1024 * 1024;
const MEDIA_TYPES = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/webm': 'webm'
};

const MISSING = /42P01|PGRST205|does not exist|could not find the table/i;

/** Lee un ajuste. Devuelve { success, value } (value = null si aún no se guardó). */
export async function getSetting(key) {
    try {
        const sb = await getClient();
        const { data, error } = await sb.from('site_settings').select('value,updated_at').eq('key', key).maybeSingle();
        if (error) {
            if (MISSING.test(`${error.code} ${error.message}`)) {
                return { success: false, needs: 'tabla', message: 'Falta ejecutar la migración 0005 (site_settings) en Supabase.' };
            }
            return fail(error, 'No se pudo leer el ajuste');
        }
        return { success: true, value: data?.value ?? null, updated_at: data?.updated_at || null };
    } catch (error) {
        return fail(error, 'No se pudo leer el ajuste');
    }
}

/** Guarda (crea o reemplaza) un ajuste. Solo funciona con sesión de admin. */
export async function saveSetting(key, value) {
    return run(async (sb) => {
        const { data, error } = await sb.from('site_settings')
            .upsert({ key, value }, { onConflict: 'key' })
            .select('key,updated_at');
        if (error) {
            if (MISSING.test(`${error.code} ${error.message}`)) {
                return { success: false, needs: 'tabla', message: 'Falta ejecutar la migración 0005 (site_settings) en Supabase.' };
            }
            return fail(error, 'No se pudo guardar el ajuste');
        }
        if (!data?.length) {
            return { success: false, needs: 'permiso', message: 'Supabase no dejó guardar: inicia sesión con la cuenta admin.' };
        }
        return { success: true, updated_at: data[0].updated_at };
    }, 'No se pudo guardar el ajuste');
}

/** Sube una imagen o video al bucket site-media y devuelve su URL pública. */
export async function uploadSiteMedia(file, carpeta = 'general') {
    return run(async (sb) => {
        const ext = file && MEDIA_TYPES[file.type];
        if (!ext) return { success: false, message: 'Usa imagen JPG, PNG, WEBP, GIF o video MP4/WEBM.' };
        if (file.size > MEDIA_MAX_BYTES) return { success: false, message: 'El archivo no puede superar 50 MB.' };
        const path = `${carpeta}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await sb.storage.from(SITE_MEDIA_BUCKET).upload(path, file, {
            contentType: file.type,
            cacheControl: '31536000',
            upsert: false
        });
        if (error) {
            const msg = /bucket not found/i.test(error.message || '')
                ? 'Falta el bucket site-media: ejecuta la migración 0005 en Supabase.'
                : traducir(error, 'No se pudo subir el archivo');
            return { success: false, message: msg };
        }
        const { data } = sb.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(path);
        return { success: true, url: data.publicUrl, path };
    }, 'No se pudo subir el archivo');
}
