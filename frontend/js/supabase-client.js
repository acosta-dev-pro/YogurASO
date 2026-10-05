/**
 * supabase-client.js - Cliente de Supabase (preparado, todavía sin conectar)
 * ---------------------------------------------------------------------------
 * Ninguna página importa este archivo hoy: la web sigue usando api.js y Express.
 * Se conectará en la fase 6, cuando exista el proyecto en Supabase.
 *
 * Qué poner aquí:
 *   - SUPABASE_URL      -> Project Settings > API > Project URL
 *   - SUPABASE_ANON_KEY -> Project Settings > API > clave pública (anon / publishable)
 *
 * Esa clave es pública por diseño: la protege RLS en la base de datos.
 * NUNCA pegues aquí la clave service_role. Si ves una clave que dice
 * "service_role" en este archivo, bórrala y cámbiala en el panel de Supabase.
 *
 * Cuando el sitio pase a Vite, estos dos valores salen de
 * import.meta.env.VITE_SUPABASE_URL y import.meta.env.VITE_SUPABASE_ANON_KEY.
 *
 * La versión de supabase-js está fija a propósito (sin ^ ni "latest") para que
 * una actualización ajena no cambie el comportamiento de la web.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';

const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-CLAVE-PUBLICA';

const sinConfigurar = SUPABASE_URL.includes('TU-PROYECTO') || SUPABASE_ANON_KEY === 'TU-CLAVE-PUBLICA';

/** true cuando ya se reemplazaron los dos marcadores de arriba */
export const supabaseListo = !sinConfigurar;

/**
 * Cliente listo para usar. Vale null mientras los valores sean marcadores,
 * así nadie intenta llamar a un proyecto que no existe.
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
