/* notice.js — avisos de YoguraSo: aviso de cookies y alertas (toasts).
   1) Cookies: la web solo guarda lo esencial (carrito y sesión en este navegador).
      El único contenido de terceros es el mapa de Google, que no se carga hasta que la persona lo acepta.
      La elección se guarda en localStorage ('yog_consent') y se puede cambiar desde "Preferencias de cookies".
   2) Toasts: reemplaza YogurUtils.showToast por avisos apilados con ícono Lucide, barra de tiempo y cierre.
   Cargar después de utils.js. Estilos en css/notice.css. */
(function () {
    'use strict';
    var KEY = 'yog_consent';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var inPages = /\/pages\//.test(location.pathname);
    var privacyUrl = (inPages ? '' : 'pages/') + 'privacidad.html#cookies';

    function svg(inner, cls) {
        return '<svg class="' + (cls || 'nt-ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
    }
    var ICONS = {
        success: '<circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/>',
        error: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
        warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
        cookie: '<path d="M11 17h.01"/><path d="M11.496 2c.324-.016.558.292.529.615a4 4 0 0 0 4.235 4.368.713.713 0 0 1 .758.757 4 4 0 0 0 4.366 4.237c.323-.03.63.204.614.527a10 10 0 0 1-2.915 6.566A1 1 0 1 1 4.93 4.918 10 10 0 0 1 11.496 2"/><path d="M12 12h.01"/><path d="M16 16h.01"/><path d="M7 14h.01"/><path d="M9 8h.01"/>',
        map: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'
    };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    /* ---------------- Toasts ---------------- */
    var stack;
    function getStack() {
        if (stack && document.body.contains(stack)) return stack;
        stack = document.createElement('div');
        stack.className = 'nt-stack';
        stack.setAttribute('aria-live', 'polite');
        stack.setAttribute('aria-relevant', 'additions');
        document.body.appendChild(stack);
        return stack;
    }
    function removeToast(t) {
        if (!t || t.dataset.out) return;
        t.dataset.out = '1';
        t.classList.add('is-out');
        setTimeout(function () { t.remove(); }, reduce.matches ? 0 : 260);
    }
    function showToast(message, type, opts) {
        type = ICONS[type] && type !== 'x' ? type : 'info';
        opts = opts || {};
        var s = getStack();
        var live = s.querySelectorAll('.nt-toast:not(.is-out)');
        if (live.length >= 3) removeToast(live[0]);
        var dur = opts.duration || (type === 'error' ? 4200 : 2800);
        var t = document.createElement('div');
        t.className = 'nt-toast nt-' + type;
        t.setAttribute('role', type === 'error' ? 'alert' : 'status');
        t.style.setProperty('--nt-dur', dur + 'ms');
        t.innerHTML = '<span class="nt-toast-ico">' + svg(ICONS[type]) + '</span>' +
            '<span class="nt-toast-body">' + (opts.title ? '<strong>' + esc(opts.title) + '</strong>' : '') + '<span>' + esc(message) + '</span></span>' +
            '<button type="button" class="nt-toast-close" aria-label="Cerrar aviso">' + svg(ICONS.x) + '</button>' +
            '<span class="nt-toast-bar" aria-hidden="true"></span>';
        s.appendChild(t);
        var left = dur, start = Date.now(), timer = setTimeout(function () { removeToast(t); }, dur);
        function pause() { clearTimeout(timer); left -= Date.now() - start; t.classList.add('is-paused'); }
        function resume() { start = Date.now(); t.classList.remove('is-paused'); timer = setTimeout(function () { removeToast(t); }, Math.max(left, 600)); }
        t.addEventListener('mouseenter', pause);
        t.addEventListener('mouseleave', resume);
        t.querySelector('.nt-toast-close').addEventListener('click', function () { clearTimeout(timer); removeToast(t); });
        return t;
    }
    window.YogurToast = showToast;
    if (window.YogurUtils) window.YogurUtils.showToast = showToast;

    /* ---------------- Consentimiento ---------------- */
    function getConsent() {
        try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
    }
    function setConsent(ext) {
        var c = { v: 1, external: !!ext, ts: new Date().toISOString() };
        try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* modo privado */ }
        document.dispatchEvent(new CustomEvent('yog:consent', { detail: c }));
        applyConsent(c);
        return c;
    }
    window.YogurConsent = { get: getConsent, set: setConsent, open: function () { openBanner(true); } };

    /* Contenido externo: <div data-consent-embed data-src="..." data-title="..."> */
    function loadEmbed(box) {
        if (box.querySelector('iframe')) return;
        var f = document.createElement('iframe');
        f.title = box.dataset.title || 'Contenido externo';
        f.src = box.dataset.src;
        f.loading = 'lazy';
        f.referrerPolicy = 'no-referrer-when-downgrade';
        f.allowFullscreen = true;
        box.innerHTML = '';
        box.appendChild(f);
        box.classList.add('is-loaded');
    }
    function placeholder(box) {
        if (box.querySelector('.nt-embed-ph')) return;
        box.innerHTML = '<div class="nt-embed-ph">' + svg(ICONS.map, 'nt-ico nt-ico-lg') +
            '<p><strong>' + esc(box.dataset.label || 'Mapa de Google') + '</strong>' +
            '<span>Para verlo se conecta con Google, que puede usar sus propias cookies.</span></p>' +
            '<div class="nt-embed-actions"><button type="button" class="nt-btn nt-btn-solid" data-act="once">Ver mapa</button>' +
            '<button type="button" class="nt-btn nt-btn-ghost" data-act="always">Permitir siempre</button></div></div>';
        box.querySelector('[data-act="once"]').addEventListener('click', function () { loadEmbed(box); });
        box.querySelector('[data-act="always"]').addEventListener('click', function () { setConsent(true); closeBanner(); });
    }
    function applyConsent(c) {
        document.querySelectorAll('[data-consent-embed]').forEach(function (box) {
            if (c && c.external) loadEmbed(box); else placeholder(box);
        });
    }

    var banner;
    function closeBanner() {
        if (!banner) return;
        var b = banner; banner = null;
        b.classList.remove('is-in');
        setTimeout(function () { b.remove(); }, reduce.matches ? 0 : 320);
    }
    function openBanner(expanded) {
        if (banner) { if (expanded) banner.classList.add('is-expanded'); return; }
        var c = getConsent();
        banner = document.createElement('section');
        banner.className = 'nt-cookie' + (expanded ? ' is-expanded' : '');
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-modal', 'false');
        banner.setAttribute('aria-labelledby', 'nt-cookie-title');
        banner.innerHTML =
            '<div class="nt-cookie-head"><span class="nt-cookie-ico">' + svg(ICONS.cookie, 'nt-ico') + '</span>' +
            '<h2 id="nt-cookie-title">Cookies, solo las justas</h2>' +
            '<button type="button" class="nt-cookie-x" data-act="essential" aria-label="Cerrar y usar solo las esenciales">' + svg(ICONS.x) + '</button></div>' +
            '<p class="nt-cookie-text">Guardamos tu carrito y tu sesión en este navegador para que la tienda funcione. El mapa de Google solo se carga si lo permites. <a href="' + privacyUrl + '">Más detalles</a></p>' +
            '<div class="nt-cookie-prefs" id="nt-cookie-prefs">' +
                '<label class="nt-pref"><span><strong>Esenciales</strong><small>Carrito, sesión y esta preferencia. Siempre activas.</small></span>' +
                    '<input type="checkbox" checked disabled><i class="nt-switch" aria-hidden="true"></i></label>' +
                '<label class="nt-pref"><span><strong>Contenido externo</strong><small>Mapa de Google Maps en la sección Encuéntranos.</small></span>' +
                    '<input type="checkbox" id="nt-pref-ext"' + (c && c.external ? ' checked' : '') + '><i class="nt-switch" aria-hidden="true"></i></label>' +
            '</div>' +
            '<div class="nt-cookie-actions">' +
                '<button type="button" class="nt-btn nt-btn-ghost nt-only-collapsed" data-act="config" aria-controls="nt-cookie-prefs" aria-expanded="false">Configurar</button>' +
                '<button type="button" class="nt-btn nt-btn-ghost nt-only-collapsed" data-act="essential">Solo esenciales</button>' +
                '<button type="button" class="nt-btn nt-btn-ghost nt-only-expanded" data-act="save">Guardar selección</button>' +
                '<button type="button" class="nt-btn nt-btn-solid" data-act="all">Aceptar todo</button>' +
            '</div>';
        document.body.appendChild(banner);
        var b = banner;
        b.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-act]');
            if (!btn) return;
            var act = btn.dataset.act;
            if (act === 'config') { b.classList.add('is-expanded'); btn.setAttribute('aria-expanded', 'true'); var x = b.querySelector('#nt-pref-ext'); if (x) x.focus(); return; }
            if (act === 'all') { setConsent(true); showToast('Listo, guardamos tu preferencia.', 'success'); }
            if (act === 'essential') setConsent(false);
            if (act === 'save') { setConsent(b.querySelector('#nt-pref-ext').checked); showToast('Preferencias guardadas.', 'success'); }
            closeBanner();
        });
        b.addEventListener('keydown', function (e) { if (e.key === 'Escape' && getConsent()) closeBanner(); });
        requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('is-in'); }); });
    }

    /* ---------------- Gestión Dinámica de Anuncios y Promociones (Banner & Modal con Video/Audio) ---------------- */
    var ANUNCIOS_KEY = 'yog_anuncios_v1';
    var WELCOME_KEY = 'yog_welcome_seen';

    function getLocalAnnouncements() {
        try {
            var raw = JSON.parse(localStorage.getItem(ANUNCIOS_KEY) || 'null');
            if (Array.isArray(raw) && raw.length) return raw;
        } catch (e) {}

        // Semillas predeterminadas profesionales listas para demostración
        var defaultAncs = [
            {
                id: 'anc-video-huila',
                title: 'Nuestra Cosecha & Pasión Artesanal',
                message: 'Conoce en este video cómo transformamos leche fresca de las granjas del Huila en un yogurt artesanal ultra cremoso.',
                placement: 'modal',
                media_type: 'video',
                media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                has_audio: true,
                video_muted: false,
                action_label: 'Probar Sabores Artesanales',
                action_url: (inPages ? '' : 'pages/') + 'productos.html',
                badge_text: 'VIDEO OFICIAL',
                active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 'anc-banner-domicilio',
                title: '¡Lanzamiento Especial!',
                message: 'Pide 3 botellas o más y disfruta de domicilio sin costo en Neiva.',
                placement: 'banner',
                media_type: 'none',
                media_url: '',
                has_audio: false,
                video_muted: true,
                action_label: 'Pedir por WhatsApp',
                action_url: 'https://wa.me/573144882046?text=Hola%20YogurASO,%20quiero%20aprovechar%20el%20domicilio%20gratis',
                badge_text: 'PROMO HOY',
                active: true,
                created_at: new Date().toISOString()
            }
        ];
        try { localStorage.setItem(ANUNCIOS_KEY, JSON.stringify(defaultAncs)); } catch (e) {}
        return defaultAncs;
    }

    function renderTopBanner() {
        if (inPages && /admin.html/i.test(location.pathname)) return; // No saturar el panel admin
        var ancs = getLocalAnnouncements();
        var bannerAnc = ancs.find(function (a) { return a.active && a.placement === 'banner'; });
        if (!bannerAnc) return;

        var seenKey = 'yog_anc_banner_' + bannerAnc.id;
        try { if (sessionStorage.getItem(seenKey)) return; } catch (e) {}

        var old = document.querySelector('.nt-top-banner');
        if (old) old.remove();

        var bar = document.createElement('aside');
        bar.className = 'nt-top-banner';
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Aviso promocional');

        var actionHtml = '';
        if (bannerAnc.action_label && bannerAnc.action_url) {
            actionHtml = '<a href="' + esc(bannerAnc.action_url) + '" class="nt-top-banner-btn">' + esc(bannerAnc.action_label) + ' →</a>';
        }

        bar.innerHTML =
            '<div class="nt-top-banner-content">' +
                (bannerAnc.badge_text ? '<span class="nt-top-banner-badge">' + esc(bannerAnc.badge_text) + '</span>' : '') +
                '<div class="nt-top-banner-text">' +
                    '<strong>' + esc(bannerAnc.title) + '</strong>' +
                    '<span>' + esc(bannerAnc.message) + '</span>' +
                '</div>' +
                actionHtml +
            '</div>' +
            '<button type="button" class="nt-top-banner-close" aria-label="Cerrar aviso">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
            '</button>';

        document.body.prepend(bar);

        bar.querySelector('.nt-top-banner-close').addEventListener('click', function () {
            try { sessionStorage.setItem(seenKey, 'true'); } catch (e) {}
            bar.classList.add('is-hidden');
            setTimeout(function () { bar.remove(); }, 200);
        });
    }

    function showModalAnnouncement(customAnc, onCloseCallback) {
        var cfg = getAnunciosConfig();
        var anc = customAnc;
        if (!anc && cfg.letreroActivo) {
            anc = {
                id: 'letrero-principal',
                title: cfg.letreroTitulo || 'Nuestra Cosecha & Pasión Artesanal',
                message: cfg.letreroMensaje || '',
                placement: 'modal',
                media_type: cfg.letreroTipo || 'video',
                media_url: cfg.letreroUrl || '',
                has_audio: true,
                video_muted: false,
                action_label: cfg.letreroBtnTexto || 'Probar Sabores Artesanales',
                action_url: cfg.letreroBtnUrl || '#productos',
                badge_text: 'NOVEDAD',
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

        var mediaHtml = '';
        var mediaUrl = anc.media_url || '';
        if (/^(assets\/|\.\.\/assets\/)/i.test(mediaUrl) && inPages && !mediaUrl.startsWith('../')) {
            mediaUrl = '../' + mediaUrl;
        }

        if (anc.media_type === 'video' && mediaUrl) {
            mediaHtml =
                '<div class="nt-welcome-video-wrap">' +
                    '<video src="' + esc(mediaUrl) + '" controls playsinline preload="metadata" style="width:100%;"></video>' +
                    '<span class="nt-video-audio-badge"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Con audio</span>' +
                '</div>';
        } else if (anc.media_type === 'varias') {
            var defaultImgs = [
                (inPages ? '../' : '') + 'assets/marketing/tazon-yogurt-fresa.jpg',
                (inPages ? '../' : '') + 'assets/marketing/pina-showcase.jpg',
                (inPages ? '../' : '') + 'assets/marketing/paisaje-campo-yoguraso.jpg'
            ];
            mediaHtml =
                '<div class="nt-welcome-gallery-wrap" style="position:relative; width:100%; overflow:hidden;">' +
                    '<div class="nt-gallery-track" style="display:flex; transition:transform 0.3s ease;">' +
                        defaultImgs.map(function(src) {
                            return '<img src="' + esc(src) + '" style="width:100%; flex:0 0 100%; height:260px; object-fit:cover;">';
                        }).join('') +
                    '</div>' +
                '</div>';
        } else if (mediaUrl) {
            mediaHtml = '<img class="nt-welcome-img" src="' + esc(mediaUrl) + '" alt="' + esc(anc.title) + '" loading="eager">';
        }

        var actionHtml = '';
        if (anc.action_label && anc.action_url) {
            actionHtml = '<a href="' + esc(anc.action_url) + '" class="nt-welcome-cta-btn">' + esc(anc.action_label) + ' <i class="fas fa-arrow-right" style="font-size:12px;"></i></a>';
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
        if (vidElement && anc.has_audio && !anc.video_muted) {
            vidElement.volume = 0.9;
        }

        function closeWelcome() {
            if (vidElement) {
                try { vidElement.pause(); } catch (e) {}
            }
            try { sessionStorage.setItem('yog_anc_modal_' + anc.id, 'true'); } catch (e) {}
            try { localStorage.setItem(WELCOME_KEY, 'true'); } catch (e) {}
            overlay.classList.remove('is-in');
            setTimeout(function () {
                overlay.remove();
                if (typeof onCloseCallback === 'function') onCloseCallback();
            }, reduce.matches ? 0 : 250);
        }

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay || e.target.closest('[data-act="close-welcome"]')) {
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

    // Exponer API global
    window.YogurNotice = {
        showModalAnnouncement: showModalAnnouncement,
        renderTopBanner: renderTopBanner,
        getAnnouncements: getLocalAnnouncements
    };

        /* ---------------- Manejo de Configuración de Anuncios y Carrusel del Header ---------------- */
    var CFG_ANUNCIOS_KEY = 'yog_anuncios_cfg_v1';

    function getAnunciosConfig() {
        try {
            var raw = JSON.parse(localStorage.getItem(CFG_ANUNCIOS_KEY) || 'null');
            if (raw) return raw;
        } catch (_) {}
        return {
            letreroActivo: true,
            letreroTipo: 'video',
            letreroTamano: 'mediano',
            letreroTitulo: 'Nuestra Cosecha & Pasión Artesanal',
            letreroMensaje: 'Conoce en este video cómo transformamos leche fresca de las granjas del Huila en un yogurt artesanal ultra cremoso.',
            letreroUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            letreroBtnTexto: 'Probar Sabores Artesanales',
            letreroBtnUrl: '#productos',
            headerCarruselActivo: true,
            headerMensajes: '🥛 Yogurt Artesanal 100% Natural • Tello & Neiva\n🛵 Domicilio sin costo en Neiva por pedidos desde 3 botellas\n🍓 Fruta real seleccionada del Huila • Sin conservantes\n✨ Presentación 500 ml & 1 Litro • Pide fácil por WhatsApp'
        };
    }

    function initHeaderTicker() {
        var cfg = getAnunciosConfig();
        var ticker = document.getElementById('headerScrollTicker');
        var track = document.getElementById('headerScrollTickerTrack');
        if (!ticker || !track || !cfg.headerCarruselActivo) {
            if (ticker) ticker.style.display = 'none';
            return;
        }

        var lines = (cfg.headerMensajes || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!lines.length) return;

        track.innerHTML = lines.map(function (msg, idx) {
            return '<span class="header-scroll-ticker-item ' + (idx === 0 ? 'is-active' : '') + '">' + esc(msg) + '</span>';
        }).join('');

        var items = track.querySelectorAll('.header-scroll-ticker-item');
        if (items.length <= 1) return;

        var curIdx = 0;
        setInterval(function () {
            items[curIdx].classList.remove('is-active');
            curIdx = (curIdx + 1) % items.length;
            items[curIdx].classList.add('is-active');
        }, 3800);
    }

    function init() {
        var c = getConsent();
        applyConsent(c);
        document.querySelectorAll('[data-open-cookies]').forEach(function (a) {
            a.addEventListener('click', function (e) { e.preventDefault(); openBanner(true); });
        });

        // 1. Renderizar Barra Superior si está activa
        renderTopBanner();
        initHeaderTicker();

        // 2. Si no estamos en páginas del panel administrativo, mostrar anuncio modal activo
        if (!inPages || !/admin.html/i.test(location.pathname)) {
            var ancs = getLocalAnnouncements();
            var modalAnc = ancs.find(function (a) { return a.active && a.placement === 'modal'; });
            var seenModal = false;
            if (modalAnc) {
                try { seenModal = !!sessionStorage.getItem('yog_anc_modal_' + modalAnc.id); } catch (e) {}
            }

            var cfg = getAnunciosConfig();
            var shouldShowModal = cfg.letreroActivo && !sessionStorage.getItem('yog_modal_seen');
            if (shouldShowModal) {
                setTimeout(function () {
                    showModalAnnouncement(null, function () {
                        sessionStorage.setItem('yog_modal_seen', '1');
                        if (!c) {
                            setTimeout(function () { openBanner(false); }, 300);
                        }
                    });
                }, 600);
            }
            // Las cookies SIEMPRE salen de forma visible e impecable si no han sido aceptadas
            if (!c) {
                setTimeout(function () { openBanner(false); }, shouldShowModal ? 2200 : 800);
            }
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
