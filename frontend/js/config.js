/**
 * config.js — Configuración central del frontend
 * Edita SOLO este archivo para cambiar WhatsApp, redes y nombre de marca.
 * Se usa en footer y botones WA. Los datos (productos, cuentas) vienen de
 * Supabase: la URL y la clave pública están en js/supabase-client.js.
 */
window.YOGUR_CONFIG = {
    COMPANY_NAME: 'YogurASO',
    COMPANY_TAGLINE: 'Yogurt artesanal elaborado a diario\nen Tello y Neiva, Huila',
    COMPANY_EMAIL: 'hola@yoguraso.co',
    COMPANY_LOCATION: 'Tello y Neiva, Huila',
    WHATSAPP_NUMBER: '573001234567', // código país + número, sin + ni espacios
    WHATSAPP_DISPLAY: '+57 300 123 4567',
    INSTAGRAM: 'https://instagram.com/yoguraso',
    FACEBOOK: 'https://facebook.com/yoguraso',
    SITE_URL: '', // al publicar: https://tudominio.com (sitemap y Open Graph)
    // Client ID de Google Cloud Console (OAuth 2.0 → Aplicación web)
    // Debe ser el mismo que está en Supabase → Authentication → Providers → Google
    GOOGLE_CLIENT_ID: '916281320880-jgbath8f4nbsqet7vld3ou1n85do489l.apps.googleusercontent.com'
};
