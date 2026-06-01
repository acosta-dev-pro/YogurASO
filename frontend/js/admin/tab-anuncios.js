/**
 * Pestaña de anuncios: imagen o video de portada y ventana de bienvenida.
 */
import { getSetting, saveSetting, uploadSiteMedia } from '../api.js';
import { imgSrc } from './constants.js';
import { toast } from './ui.js';
import { compressProductFileToDataUrl } from './imagen.js';

export const CFG_ANUNCIOS_KEY = 'yog_anuncios_cfg_v1';
const SETTING_KEY = 'anuncios';

const IMG_INICIO = 'assets/marketing/paisaje-campo-yoguraso.jpg';
const IMG_LETRERO = 'assets/marketing/tazon-yogurt-fresa.jpg';
const VIDEO_DEMO = 'assets/video/empaque-botella.mp4';
const SPLASH_VIEJO = /yoguraso-splash-fresa\.png/i;
const RE_VIDEO = /\.(mp4|webm|ogg|mov)(\?|$)/i;

const DEFAULTS = {
    inicioActivo: true,
    inicioTipo: 'imagen',
    inicioKicker: 'Desde el campo',
    inicioTitulo: 'Neiva · Tello',
    inicioTexto: 'Fruta seleccionada con cuidado para cada tanda.',
    inicioUrl: IMG_INICIO,
    letreroActivo: true,
    letreroTipo: 'imagen',
    letreroTamano: 'mediano',
    letreroTitulo: 'Nuestra Cosecha & Pasión Artesanal',
    letreroMensaje: 'Conoce cómo transformamos leche fresca de las granjas del Huila en un yogurt artesanal ultra cremoso.',
    letreroUrl: IMG_LETRERO,
    letreroBtnTexto: 'Probar Sabores Artesanales',
    letreroBtnUrl: '#productos'
};

const $ = (id) => document.getElementById(id);

export function esFuenteVideo(url, tipo) {
    if (tipo === 'video') return true;
    const s = String(url || '').trim().toLowerCase();
    return RE_VIDEO.test(s) || s.startsWith('data:video/');
}

/** Ruta lista para mostrar en el panel (las de assets/ salen de /pages/). */
function srcPreview(rawUrl, fallback) {
    const clean = String(rawUrl || '').trim();
    if (!clean || clean.startsWith('blob:')) return imgSrc(fallback);
    return imgSrc(clean);
}

function pintarPreview(prefijo, rawUrl, tipo, fallback) {
    const img = $(`cfg-${prefijo}-preview-img`);
    const vid = $(`cfg-${prefijo}-preview-video`);
    if (!img || !vid) return;
    const src = srcPreview(rawUrl, fallback);
    if (esFuenteVideo(rawUrl, tipo)) {
        img.hidden = true;
        vid.hidden = false;
        if (vid.getAttribute('src') !== src) vid.src = src;
        return;
    }
    vid.pause?.();
    vid.hidden = true;
    img.hidden = false;
    img.onerror = () => {
        img.onerror = null;
        img.src = imgSrc(fallback);
    };
    img.src = src;
}

export function actualizarVistaPreviaAnuncios() {
    const inicioUrl = $('cfg-inicio-url')?.value.trim() || IMG_INICIO;
    pintarPreview('inicio', SPLASH_VIEJO.test(inicioUrl) ? IMG_INICIO : inicioUrl, $('cfg-inicio-tipo')?.value || 'imagen', IMG_INICIO);

    const letreroTipo = $('cfg-letrero-tipo')?.value || 'imagen';
    let letreroUrl = $('cfg-letrero-url')?.value.trim() || IMG_LETRERO;
    if (SPLASH_VIEJO.test(letreroUrl) || (letreroTipo === 'imagen' && RE_VIDEO.test(letreroUrl))) {
        letreroUrl = IMG_LETRERO;
        if ($('cfg-letrero-url')) $('cfg-letrero-url').value = letreroUrl;
    }
    pintarPreview('letrero', letreroUrl, letreroTipo, IMG_LETRERO);
}

/** Cambia el tipo (imagen/video) y, si la URL no corresponde, pone una de ejemplo. */
export function ajustarUrlPorTipo(target) {
    const tipoEl = $(`cfg-${target}-tipo`);
    const urlEl = $(`cfg-${target}-url`);
    if (!tipoEl || !urlEl) return;
    const esVideo = esFuenteVideo(urlEl.value, 'imagen');
    if (tipoEl.value === 'video' && !esVideo) urlEl.value = VIDEO_DEMO;
    else if (tipoEl.value === 'imagen' && esVideo) urlEl.value = target === 'inicio' ? IMG_INICIO : IMG_LETRERO;
}

/** Aplica un acceso rápido (chip) de multimedia al formulario. */
export function aplicarPreset(target, tipo, url) {
    const tEl = $(`cfg-${target}-tipo`);
    const uEl = $(`cfg-${target}-url`);
    if (tEl) tEl.value = tipo;
    if (uEl) uEl.value = url;
    actualizarVistaPreviaAnuncios();
}

function normalizar(cfg) {
    const out = { ...DEFAULTS, ...cfg };
    // Compatibilidad con nombres antiguos de la portada
    out.inicioTipo = cfg.inicioTipo || cfg.inicioBannerTipo || out.inicioTipo;
    out.inicioKicker = cfg.inicioKicker || cfg.inicioBannerKicker || out.inicioKicker;
    out.inicioTitulo = cfg.inicioTitulo || cfg.inicioBannerTitulo || out.inicioTitulo;
    out.inicioTexto = cfg.inicioTexto || cfg.inicioBannerTexto || out.inicioTexto;
    out.inicioUrl = cfg.inicioUrl || cfg.inicioBannerUrl || out.inicioUrl;
    if (SPLASH_VIEJO.test(out.inicioUrl)) out.inicioUrl = IMG_INICIO;
    if (SPLASH_VIEJO.test(out.letreroUrl) || (out.letreroTipo === 'imagen' && RE_VIDEO.test(out.letreroUrl))) {
        out.letreroUrl = IMG_LETRERO;
    }
    return out;
}

function leerCopiaLocal() {
    try { return JSON.parse(localStorage.getItem(CFG_ANUNCIOS_KEY) || 'null'); } catch (_) { return null; }
}

function escribirCopiaLocal(cfg) {
    try {
        localStorage.setItem(CFG_ANUNCIOS_KEY, JSON.stringify(cfg));
        // Para que el visitante (en este navegador) vea de nuevo la ventana actualizada
        sessionStorage.removeItem('yog_modal_seen');
        sessionStorage.removeItem('yog_modal_seen_ver');
    } catch (_) { /* modo privado o sin espacio */ }
}

function llenarFormulario(cfg) {
    const setVal = (id, val) => { const el = $(id); if (el) el.value = val ?? ''; };
    const setChk = (id, val) => { const el = $(id); if (el) el.checked = Boolean(val); };
    setChk('cfg-inicio-activo', cfg.inicioActivo !== false);
    setVal('cfg-inicio-tipo', cfg.inicioTipo);
    setVal('cfg-inicio-kicker', cfg.inicioKicker);
    setVal('cfg-inicio-titulo', cfg.inicioTitulo);
    setVal('cfg-inicio-texto', cfg.inicioTexto);
    setVal('cfg-inicio-url', cfg.inicioUrl);
    setChk('cfg-letrero-activo', cfg.letreroActivo !== false);
    setVal('cfg-letrero-tipo', cfg.letreroTipo);
    setVal('cfg-letrero-tamano', cfg.letreroTamano);
    setVal('cfg-letrero-titulo', cfg.letreroTitulo);
    setVal('cfg-letrero-mensaje', cfg.letreroMensaje);
    setVal('cfg-letrero-url', cfg.letreroUrl);
    setVal('cfg-letrero-btn-texto', cfg.letreroBtnTexto);
    setVal('cfg-letrero-btn-url', cfg.letreroBtnUrl);
}

/** Carga la configuración desde Supabase (o la última copia local si no hay conexión). */
export async function cargarConfiguracionAnuncios() {
    const res = await getSetting(SETTING_KEY);
    let cfg = null;
    if (res.success && res.value && typeof res.value === 'object') {
        cfg = res.value;
        escribirCopiaLocal(cfg);
    } else if (!res.success) {
        toast(`${res.message || 'No se pudieron cargar los anuncios'} Se muestra la última copia de este navegador.`, 'error');
        cfg = leerCopiaLocal();
    }
    llenarFormulario(normalizar(cfg || {}));
    actualizarVistaPreviaAnuncios();
}

function leerFormulario() {
    const val = (id, vacio = '') => $(id)?.value.trim() || vacio;
    return {
        inicioActivo: $('cfg-inicio-activo')?.checked ?? true,
        inicioTipo: val('cfg-inicio-tipo', 'imagen'),
        inicioKicker: val('cfg-inicio-kicker', DEFAULTS.inicioKicker),
        inicioTitulo: val('cfg-inicio-titulo', DEFAULTS.inicioTitulo),
        inicioTexto: val('cfg-inicio-texto'),
        inicioUrl: val('cfg-inicio-url', IMG_INICIO),
        letreroActivo: $('cfg-letrero-activo')?.checked ?? true,
        letreroTipo: val('cfg-letrero-tipo', 'imagen'),
        letreroTamano: val('cfg-letrero-tamano', 'mediano'),
        letreroTitulo: val('cfg-letrero-titulo'),
        letreroMensaje: val('cfg-letrero-mensaje'),
        letreroUrl: val('cfg-letrero-url', IMG_LETRERO),
        letreroBtnTexto: val('cfg-letrero-btn-texto', DEFAULTS.letreroBtnTexto),
        letreroBtnUrl: val('cfg-letrero-btn-url', DEFAULTS.letreroBtnUrl),
        updatedAt: Date.now()
    };
}

/** Publica la configuración en la base. Devuelve true si quedó guardada para todos. */
export async function guardarConfiguracionAnuncios() {
    const cfg = leerFormulario();
    const res = await saveSetting(SETTING_KEY, cfg);
    if (!res.success) {
        toast(res.message || 'No se pudo guardar. Los visitantes no verán el cambio.', 'error');
        return false;
    }
    escribirCopiaLocal(cfg);
    actualizarVistaPreviaAnuncios();
    toast('Anuncios guardados: ya los ve toda la tienda', 'success');
    return true;
}

/** Vista previa de la ventana de bienvenida sin publicar (usa solo la copia local). */
export function probarLetrero() {
    escribirCopiaLocal(leerFormulario());
    window.YogurNotice?.showModalAnnouncement?.(null);
}

/** Sube la imagen/video al bucket site-media y lo deja en el formulario (falta pulsar Guardar). */
export async function manejarSubidaArchivoMultimedia(file, target) {
    if (!file) return;
    const isVid = file.type.startsWith('video/');
    if (!isVid && !file.type.startsWith('image/')) {
        toast('Selecciona una imagen (.jpg, .png, .webp) o un video (.mp4, .webm)', 'error');
        return;
    }
    const tipoInput = $(`cfg-${target}-tipo`);
    const urlInput = $(`cfg-${target}-url`);
    toast(`Subiendo "${file.name}"…`, 'info');

    const res = await uploadSiteMedia(file, target === 'inicio' ? 'inicio' : 'anuncio');
    let url = res.success ? res.url : '';
    if (!url && !isVid) {
        // Respaldo solo para imágenes: se guarda comprimida dentro del propio ajuste
        url = await compressProductFileToDataUrl(file, 960, 720, 0.8);
    }
    if (!url) {
        toast(res.message || 'No se pudo subir el archivo', 'error');
        return;
    }
    if (tipoInput) tipoInput.value = isVid ? 'video' : 'imagen';
    if (urlInput) urlInput.value = url;
    actualizarVistaPreviaAnuncios();
    toast(res.success
        ? `"${file.name}" subido. Pulsa Guardar para publicarlo.`
        : `${res.message} Se usará una copia comprimida; pulsa Guardar para publicarla.`, res.success ? 'success' : 'info');
}
