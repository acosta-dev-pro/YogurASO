/**
 * config.js — Configuración central del frontend
 * Edita SOLO este archivo para cambiar WhatsApp, API, redes y nombre de marca.
 * Se usa en footer, botones WA y llamadas a la API.
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
    API_URL: 'http://localhost:3000/api',
    API_ORIGIN: 'http://localhost:3000',
    // Al publicar: https://tudominio.com  (también define FRONTEND_URL en backend/.env)
    SITE_URL: '', // al publicar: https://tudominio.com (sitemap y Open Graph)
    // Client ID de Google Cloud Console (OAuth 2.0 → Aplicación web)
    // Debe coincidir con GOOGLE_CLIENT_ID del backend/.env
    GOOGLE_CLIENT_ID: '916281320880-jgbath8f4nbsqet7vld3ou1n85do489l.apps.googleusercontent.com'
};
