/* notice.js — avisos de YoguraSo: aviso de cookies y alertas (toasts).
   1) Cookies: la web solo guarda lo esencial (carrito y sesión en este navegador).
      El único contenido de terceros es el mapa de Google, que no se carga hasta que la persona lo acepta.
      La elección se guarda en localStorage ('yog_consent') y se puede cambiar desde "Preferencias de cookies".
   2) Toasts: reemplaza YogurUtils.showToast por avisos apilados con ícono Lucide, barra de tiempo y cierre.
   La portada y la ventana de bienvenida están en site-announcements.js.
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
            '<p class="nt-cookie-text">Guardamos tu carrito y tu sesión en este navegador para que la tienda funcione. El mapa de Google solo se carga si lo permites; no usamos cookies de publicidad ni de analítica. Si entras con Google, Google puede usar las suyas. <a href="' + privacyUrl + '">Más detalles</a></p>' +
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

    function init() {
        var c = getConsent();
        applyConsent(c);
        document.querySelectorAll('[data-open-cookies]').forEach(function (a) {
            a.addEventListener('click', function (e) { e.preventDefault(); openBanner(true); });
        });
        if (!c && !/admin\.html/i.test(location.pathname)) {
            // Si la página muestra la ventana de bienvenida, el aviso de cookies espera a que se cierre
            var hayBienvenida = Boolean(document.querySelector('script[src*="site-announcements"]'));
            setTimeout(function () { openBanner(false); }, hayBienvenida ? 2200 : 800);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
