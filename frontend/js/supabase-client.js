/**
 * Cliente de Supabase. Solo lleva la URL del proyecto y la clave pública.
 * La clave secreta no debe ir en este archivo.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';

const SUPABASE_URL = 'https://xrgpqdqayevzyjfolcfb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Te13tbZo0GYLIn54PnOEwA_sJ-XDBjl';

const sinConfigurar = SUPABASE_URL.includes('TU-PROYECTO') || SUPABASE_ANON_KEY === 'TU-CLAVE-PUBLICA';

/** true cuando ya están la URL y la clave pública */
export const supabaseListo = !sinConfigurar;

/**
 * Cliente listo para usar (una sola instancia por página).
 * La sesión se guarda en localStorage del navegador y se renueva sola.
 */
export const supabase = sinConfigurar
    ? null
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });

/** Devuelve el cliente o lanza un error claro en español si falta configurar. */
export function obtenerSupabase() {
    if (!supabase) {
        throw new Error('Supabase no está configurado. Edita frontend/js/supabase-client.js con la URL y la clave pública.');
    }
    return supabase;
}

/** Nombre del bucket donde el admin sube las fotos de producto. */
export const BUCKET_PRODUCTOS = 'product-images';
