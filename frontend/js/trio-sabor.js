/**
 * trio-sabor.js — La tarjeta "Propósito" sigue el sabor activo del hero.
 * Escucha el evento `yg:flavorchange` (hero.js → setTheme) y, al cargar,
 * lee body[data-flavor]. Colores: tokens --hero-bg de css/hero.css.
 * Botellas: assets/products/yoguraso-<slug>-500ml.webp (mismo origen que hero.js).
 * Tras pasteles (--bg-* en brand.css), el fondo es claro: tinta oscura.
 */
(function () {
    'use strict';

    var card = document.querySelector('.ytrio__card--proposito');
    if (!card) return;
    var bottle = card.querySelector('.ytrio__bottle');
    var base = 'assets/products/yoguraso-';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pending = null;
    var busy = false;
    var probe = null;

    function known(slug) {
        var list = window.YOGUR_FLAVORS;
        if (!list) return null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].slug === slug) return list[i];
        }
        return null;
    }

    /** Resuelve var(--hero-bg) a rgb() (getPropertyValue no expande custom props). */
    function resolvedHeroBg() {
        if (!probe) {
            probe = document.createElement('span');
            probe.setAttribute('aria-hidden', 'true');
            probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;background-color:var(--hero-bg,#F4CBCF)';
            document.body.appendChild(probe);
        }
        return getComputedStyle(probe).backgroundColor || '';
    }

    /** Contraste WCAG del blanco sobre un color css (hex o rgb/rgba). */
    function whiteContrast(cssColor) {
        var r, g, b, m;
        m = /^#?([0-9a-f]{6})$/i.exec((cssColor || '').trim());
        if (m) {
            var n = parseInt(m[1], 16);
            r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255;
        } else {
            m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(cssColor || '');
            if (!m) return 1; /* sin color legible → asumir claro → tinta oscura */
            r = +m[1]; g = +m[2]; b = +m[3];
        }
        var ch = [r, g, b].map(function (v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        var L = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
        return 1.05 / (L + 0.05);
    }

    function paint(flavor) {
        card.dataset.sabor = flavor.slug;
        /* Pasteles: blanco sobre --hero-bg casi nunca pasa; default dark. */
        card.dataset.ink = 'light'; /* Juan: blanco como hero/carrusel */
        if (!bottle) return;
        bottle.src = base + flavor.slug + '-500ml.webp';
        bottle.alt = flavor.alt || ('Yogurt artesanal de ' + flavor.nombre + ', 500 ml');
    }

    function apply(flavor) {
        if (!flavor || card.dataset.sabor === flavor.slug) return;
        if (reduce || !bottle || !card.dataset.sabor) { paint(flavor); return; }
        if (busy) { pending = flavor; return; }
        busy = true;
        bottle.classList.add('is-swapping');
        var done = false;
        function finish() {
            if (done) return;
            done = true;
            bottle.removeEventListener('transitionend', onEnd);
            paint(flavor);
            bottle.classList.remove('is-swapping');
            busy = false;
            if (pending) { var next = pending; pending = null; apply(next); }
        }
        function onEnd(e) {
            if (e.target === bottle && e.propertyName === 'opacity') finish();
        }
        bottle.addEventListener('transitionend', onEnd);
        setTimeout(finish, 450);
    }

    function fromBody() {
        apply(known(document.body.dataset.flavor));
    }

    document.addEventListener('yg:flavorchange', function (e) {
        var f = e.detail && e.detail.flavor;
        if (f && f.slug) apply(f);
    });

    if (document.body.dataset.flavor) fromBody();
    else document.addEventListener('DOMContentLoaded', fromBody);
})();