/* site-announcements.js — portada de inicio (#fruta-real) y ventana de bienvenida editables desde el admin.
   La configuración vive en Supabase (tabla site_settings, clave "anuncios"), así que la ven todos los visitantes.
   localStorage solo guarda la última copia para pintar al instante mientras llega la respuesta de la base.
   Imagen/video: URL pública del bucket site-media (o una ruta de assets/). Estilos en css/notice.css.
   Cargar después de notice.js (usa YogurToast solo si existe). */
(function () {
    'use strict';
    var CFG_ANUNCIOS_KEY = 'yog_anuncios_cfg_v1';
    var SETTING_KEY = 'anuncios';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var inPages = /\/pages\//.test(location.pathname);
    var isAdminPage = /admin\.html/i.test(location.pathname);

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    /* ---------------- Rutas y tipo de multimedia ---------------- */
    function resolveMediaPath(rawUrl) {
        var s = String(rawUrl || '').trim();
        if (!s) return '';
        // Un blob: pertenece a otra sesión del navegador y ya no existe: usar el respaldo
        if (/^blob:/i.test(s)) return '';
        if (/^(https?:|data:|blob:|\/)/i.test(s)) return s;
        var clean = s.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
        return (inPages ? '../' : '') + clean;
    }

    function isVideoSource(url, explicitType) {
        var s = String(url || '').trim().toLowerCase();
        if (s.indexOf('data:video/') === 0) return true;
        if (s.indexOf('data:image/') === 0) return false;
        if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(s)) return true;
        if (/\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(s)) return false;
        return explicitType === 'video';
    }

    function loadMediaUrl(raw) {
        var s = String(raw || '').trim();
        return Promise.resolve(s ? resolveMediaPath(s) : '');
    }

    /* ---------------- Configuración (Supabase + copia local) ---------------- */
    function getAnunciosConfig() {
        var defaults = {
            letreroActivo: false,
            letreroTipo: 'imagen',
            letreroTamano: 'mediano',
            letreroTitulo: 'Nuestra Cosecha & Pasión Artesanal',
            letreroMensaje: 'Conoce cómo transformamos leche fresca de las granjas del Huila en un yogurt artesanal ultra cremoso.',
            letreroUrl: 'assets/marketing/tazon-yogurt-fresa.jpg',
            letreroBtnTexto: 'Probar Sabores Artesanales',
            letreroBtnUrl: '#productos',
            inicioBannerTipo: 'imagen',
            inicioBannerUrl: 'assets/marketing/paisaje-campo-yoguraso.jpg',
            inicioBannerKicker: 'Desde el campo',
            inicioBannerTitulo: 'Neiva · Tello',
            inicioBannerTexto: 'Fruta seleccionada con cuidado para cada tanda.',
            updatedAt: '0'
        };
        try {
            var raw = JSON.parse(localStorage.getItem(CFG_ANUNCIOS_KEY) || 'null');
            if (raw && typeof raw === 'object') {
                return Object.assign({}, defaults, raw);
            }
        } catch (_) {}
        return defaults;
    }

    function saveLocalCopy(cfg) {
        try { localStorage.setItem(CFG_ANUNCIOS_KEY, JSON.stringify(cfg)); } catch (_) {}
    }

    /** Pide la configuración a la base y, si cambió, repinta portada y ventana. */
    function syncFromServer() {
        return import('./api/ajustes.js').then(function (m) { return m.getSetting(SETTING_KEY); }).then(function (res) {
            if (!res || !res.success || !res.value || typeof res.value !== 'object') return;
            var before = localStorage.getItem(CFG_ANUNCIOS_KEY);
            var next = JSON.stringify(res.value);
            if (before === next) return;
            saveLocalCopy(res.value);
            applyHomeFeaturedMedia();
        }).catch(function () { /* sin conexión: queda la última copia */ });
    }

    function renderTopBanner() {
        var staticBanner = document.getElementById('promoDividerBanner');
        if (staticBanner) {
            staticBanner.classList.remove('is-hidden');
        }
    }

    /**
     * Sincroniza la sección multimedia de inicio (#fruta-real "Desde el campo · Neiva · Tello")
     * con la imagen o video configurado desde el panel Admin.
     */
    function applyHomeFeaturedMedia() {
        var campoTile = document.querySelector('#fruta-real .fcol__campo');
        if (!campoTile) return;
        var cfg = getAnunciosConfig();
        if (cfg.inicioActivo === false) return;

        var kickerEl = campoTile.querySelector('.fcol__k');
        var titleEl = campoTile.querySelector('h3');
        var descEl = campoTile.querySelector('p');
        var kickerVal = cfg.inicioKicker || cfg.inicioBannerKicker;
        var titleVal = cfg.inicioTitulo || cfg.inicioBannerTitulo;
        var textVal = cfg.inicioTexto || cfg.inicioBannerTexto;
        if (kickerEl && kickerVal) kickerEl.textContent = kickerVal;
        if (titleEl && titleVal) titleEl.textContent = titleVal;
        if (descEl && textVal) descEl.textContent = textVal;

        var rawMedia = cfg.inicioUrl || cfg.inicioBannerUrl || 'assets/marketing/paisaje-campo-yoguraso.jpg';
        if (/yoguraso-splash-fresa\.png/i.test(rawMedia)) {
            rawMedia = 'assets/marketing/paisaje-campo-yoguraso.jpg';
        }
        var tipo = cfg.inicioTipo || cfg.inicioBannerTipo || 'imagen';

        loadMediaUrl(rawMedia).then(function (resolvedUrl) {
            var fallbackImg = (inPages ? '../' : '') + 'assets/marketing/paisaje-campo-yoguraso.jpg';
            var finalUrl = resolvedUrl || fallbackImg;
            var wantVideo = isVideoSource(rawMedia, tipo) && resolvedUrl;

            var existingVideo = campoTile.querySelector('video.fcol__photo');
            var existingImg = campoTile.querySelector('img.fcol__photo');

            if (wantVideo) {
                if (existingImg) existingImg.style.display = 'none';
                if (!existingVideo) {
                    existingVideo = document.createElement('video');
                    existingVideo.className = 'fcol__photo';
                    existingVideo.muted = true;
                    existingVideo.loop = true;
                    existingVideo.autoplay = true;
                    existingVideo.playsInline = true;
                    existingVideo.setAttribute('playsinline', '');
                    existingVideo.setAttribute('webkit-playsinline', '');
                    campoTile.insertBefore(existingVideo, campoTile.firstChild);
                }
                existingVideo.style.display = 'block';
                if (existingVideo.getAttribute('src') !== finalUrl) {
                    existingVideo.src = finalUrl;
                    existingVideo.play().catch(function () {});
                }
            } else {
                if (existingVideo) {
                    try { existingVideo.pause(); } catch (_) {}
                    existingVideo.remove();
                }
                if (!existingImg) {
                    existingImg = document.createElement('img');
                    existingImg.className = 'fcol__photo';
                    existingImg.alt = titleVal || 'Paisaje del campo en Neiva y Tello, Huila';
                    campoTile.insertBefore(existingImg, campoTile.firstChild);
                }
                existingImg.loading = 'eager';
                existingImg.style.display = 'block';
                existingImg.onerror = function () {
                    if (existingImg.src !== fallbackImg) existingImg.src = fallbackImg;
                };
                if (existingImg.getAttribute('src') !== finalUrl) {
                    existingImg.src = finalUrl;
                }
            }
        });
    }

    async function showModalAnnouncement(customAnc, onCloseCallback) {
        // Remover cualquier ventana previa abierta
        var prev = document.querySelector('.nt-welcome-overlay');
        if (prev) prev.remove();

        var cfg = getAnunciosConfig();
        var anc = customAnc;
        if (!anc && cfg.letreroActivo) {
            var letreroMediaRaw = cfg.letreroUrl || 'assets/marketing/tazon-yogurt-fresa.jpg';
            if (/yoguraso-splash-fresa\.png/i.test(letreroMediaRaw)) {
                letreroMediaRaw = 'assets/marketing/tazon-yogurt-fresa.jpg';
            }
            anc = {
                id: 'letrero-principal',
                title: cfg.letreroTitulo || 'Nuestra Cosecha & Pasión Artesanal',
                message: cfg.letreroMensaje || '',
                placement: 'modal',
                media_type: cfg.letreroTipo || 'imagen',
                media_url: letreroMediaRaw,
                has_audio: true,
                video_muted: false,
                action_label: cfg.letreroBtnTexto || 'Probar Sabores Artesanales',
                action_url: cfg.letreroBtnUrl || '#productos',
                badge_text: 'DESTACADO',
                tamano: cfg.letreroTamano || 'mediano',
                active: true
            };
        }
        if (!anc || anc.active === false) {
            if (typeof onCloseCallback === 'function') onCloseCallback();
            return;
        }

        var overlay = document.createElement('div');
        overlay.className = 'nt-welcome-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', anc.title || 'Anuncio YogurASO');

        var maxW = '580px';
        if (anc.tamano === 'compacto') maxW = '440px';
        else if (anc.tamano === 'grande') maxW = '740px';

        var rawUrl = anc.media_url || '';
        var resolvedUrl = await loadMediaUrl(rawUrl);
        var defaultImg = (inPages ? '../' : '') + 'assets/marketing/tazon-yogurt-fresa.jpg';
        var defaultVideo = (inPages ? '../' : '') + 'assets/video/empaque-botella.mp4';

        var mediaHtml = '';
        if (anc.media_type === 'varias') {
            var defaultImgs = [
                (inPages ? '../' : '') + 'assets/marketing/tazon-yogurt-fresa.jpg',
                (inPages ? '../' : '') + 'assets/marketing/pina-showcase.jpg',
                (inPages ? '../' : '') + 'assets/marketing/paisaje-campo-yoguraso.jpg'
            ];
            mediaHtml =
                '<div class="nt-welcome-gallery-wrap" style="position:relative; width:100%; overflow:hidden;">' +
                    '<div class="nt-gallery-track" style="display:flex; transition:transform 0.3s ease;">' +
                        defaultImgs.map(function (src) {
                            return '<img src="' + esc(src) + '" alt="" style="width:100%; flex:0 0 100%; height:260px; object-fit:cover;">';
                        }).join('') +
                    '</div>' +
                '</div>';
        } else {
            var renderAsVideo = isVideoSource(rawUrl, anc.media_type);
            if (anc.media_type === 'video' && !renderAsVideo && !rawUrl) {
                renderAsVideo = true;
            }
            if (renderAsVideo) {
                var videoSrc = resolvedUrl || defaultVideo;
                mediaHtml =
                    '<div class="nt-welcome-video-wrap">' +
                        '<video src="' + esc(videoSrc) + '" controls playsinline preload="metadata" style="width:100%;"></video>' +
                        '<span class="nt-video-audio-badge"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Video</span>' +
                    '</div>';
            } else {
                var imgSrc = (resolvedUrl && !isVideoSource(rawUrl, 'imagen')) ? resolvedUrl : defaultImg;
                mediaHtml = '<img class="nt-welcome-img" src="' + esc(imgSrc) + '" alt="' + esc(anc.title) + '" loading="eager" onerror="this.onerror=null;this.src=\'' + esc(defaultImg) + '\';">';
            }
        }

        var actionHtml = '';
        if (anc.action_label && anc.action_url) {
            actionHtml = '<a href="' + esc(anc.action_url) + '" class="nt-welcome-cta-btn" data-act="cta-welcome">' + esc(anc.action_label) + ' <i class="fas fa-arrow-right" style="font-size:12px;"></i></a>';
        }

        overlay.innerHTML =
            '<div class="nt-welcome-window" style="max-width:' + maxW + ';">' +
                '<button type="button" class="nt-welcome-close" data-act="close-welcome" aria-label="Cerrar anuncio">' +
                    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
                '</button>' +
                '<div class="nt-welcome-content">' +
                    mediaHtml +
                    '<div class="nt-welcome-info">' +
                        '<div class="nt-welcome-info-header">' +
                            (anc.badge_text ? '<span class="nt-welcome-tag">' + esc(anc.badge_text) + '</span>' : '') +
                        '</div>' +
                        '<h3 class="nt-welcome-title">' + esc(anc.title) + '</h3>' +
                        '<p class="nt-welcome-desc">' + esc(anc.message) + '</p>' +
                        '<div class="nt-welcome-actions">' +
                            actionHtml +
                            '<button type="button" class="nt-welcome-dismiss-btn" data-act="close-welcome">Cerrar</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var vidElement = overlay.querySelector('video');
        if (vidElement) {
            vidElement.onerror = function () {
                if (vidElement.src.indexOf('empaque-botella.mp4') === -1) {
                    vidElement.src = defaultVideo;
                }
            };
            if (anc.has_audio && !anc.video_muted) {
                vidElement.volume = 0.9;
            }
        }

        function closeWelcome() {
            if (vidElement) {
                try { vidElement.pause(); } catch (e) {}
            }
            try {
                sessionStorage.setItem('yog_modal_seen', '1');
                sessionStorage.setItem('yog_modal_seen_ver', String(cfg.updatedAt || '1'));
            } catch (e) {}
            overlay.classList.remove('is-in');
            setTimeout(function () {
                overlay.remove();
                if (typeof onCloseCallback === 'function') onCloseCallback();
            }, reduce.matches ? 0 : 250);
        }

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay || e.target.closest('[data-act="close-welcome"]') || e.target.closest('[data-act="cta-welcome"]')) {
                closeWelcome();
            }
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape' && document.body.contains(overlay)) {
                document.removeEventListener('keydown', escHandler);
                closeWelcome();
            }
        });

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                overlay.classList.add('is-in');
            });
        });
    }

    window.YogurNotice = {
        showModalAnnouncement: showModalAnnouncement,
        renderTopBanner: renderTopBanner,
        applyHomeFeaturedMedia: applyHomeFeaturedMedia,
        getConfig: getAnunciosConfig,
        saveLocalCopy: saveLocalCopy
    };

    /* Otra pestaña del mismo navegador guardó la configuración (p. ej. el admin) */
    window.addEventListener('storage', function (e) {
        if (e.key === CFG_ANUNCIOS_KEY) applyHomeFeaturedMedia();
    });

    function shouldShowWelcome(cfg) {
        if (!cfg.letreroActivo) return false;
        var seenVer = '';
        var seen = false;
        try {
            seenVer = sessionStorage.getItem('yog_modal_seen_ver') || '';
            seen = Boolean(sessionStorage.getItem('yog_modal_seen'));
        } catch (_) {}
        var isNewVersion = Boolean(cfg.updatedAt && cfg.updatedAt !== '0' && seenVer !== String(cfg.updatedAt));
        return !seen || isNewVersion;
    }

    function init() {
        renderTopBanner();
        applyHomeFeaturedMedia();
        if (isAdminPage) return;

        // Primero se muestra la última copia local; luego se confirma contra la base.
        syncFromServer().then(function () {
            var cfg = getAnunciosConfig();
            if (!shouldShowWelcome(cfg)) return;
            setTimeout(function () {
                showModalAnnouncement(null, function () {
                    if (window.YogurConsent && !window.YogurConsent.get()) window.YogurConsent.open();
                });
            }, 450);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
