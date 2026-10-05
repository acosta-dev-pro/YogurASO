/**
 * pages-motion.js — entradas escalonadas (fade-in + slide-up) del contenido de las páginas internas.
 * Va en el <head> de cada página (sin defer) y trabaja junto a css/brand-pages.css.
 * Complementa a js/ui-motion.js y css/motion.css (contador del carrito y entrada de
 * las cards del catálogo): aquí solo se animan bloques de contenido, nunca las cards.
 *
 * Qué hace:
 *  · Marca <html class="bp-pages"> al instante (sin JS, todo se ve normal).
 *  · Cada elemento de los grupos de abajo entra con opacidad + subida de 14 px,
 *    90 ms de retardo entre hermanos (tope de 8 pasos), 0.4 s, easing suave.
 *  · Las filas del carrito se animan solo la primera vez que aparecen, para
 *    que sumar o restar cantidades no parpadee.
 *  · Si el usuario pidió menos movimiento, no se activa nada.
 * No toca ninguna otra lógica (carrito, login, admin, WhatsApp).
 */
(function () {
    'use strict';
    var root = document.documentElement;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.classList.add('bp-pages');

    var MAX_STEPS = 8;

    // Hermanos que entran escalonados (se agrupan por su padre)
    var STATIC_GROUPS = [
        '.productos-header > *', '.catalog-toolbar', '.catalog-chips',
        '.auth-card',
        '.cart-page > *', '.cart-page-heading', '.cart-select-bar',
        '.profile-header', '.profile-grid > *', '.profile-orders',
        '.admin-subnav', '.admin-section', '.admin-stats .admin-stat',
        '#texto.auth-container > *', '.page-404-inner',
        '.footer-inner > *'
    ];
    // Contenedores que se llenan por JS: { selector del contenedor, solo la primera tanda }
    var DYNAMIC = [
        { sel: '#cart-page-items', once: true }
    ];

    var io = null;
    if ('IntersectionObserver' in window) {
        io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                io.unobserve(entry.target);
                show(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    }

    function show(el) {
        el.classList.add('is-in');
        var i = Number(el.style.getPropertyValue('--bp-i')) || 0;
        // Al terminar la entrada se quita la clase para devolver el control de
        // transiciones (hover, borde) a la hoja de estilos normal.
        window.setTimeout(function () {
            el.classList.remove('bp-reveal', 'is-in', 'bp-done');
            el.style.removeProperty('--bp-i');
        }, 520 + i * 90);
    }

    function mark(el, index) {
        if (!el || el.classList.contains('bp-reveal') || el.hidden) return;
        el.classList.add('bp-reveal');
        el.style.setProperty('--bp-i', Math.min(index, MAX_STEPS));
        if (io) io.observe(el); else show(el);
    }

    function markGroup(list) {
        var byParent = new Map();
        list.forEach(function (el) {
            var p = el.parentElement;
            if (!byParent.has(p)) byParent.set(p, []);
            byParent.get(p).push(el);
        });
        byParent.forEach(function (els) {
            els.forEach(function (el, i) { mark(el, i); });
        });
    }

    function init() {
        STATIC_GROUPS.forEach(function (sel) {
            markGroup(Array.prototype.slice.call(document.querySelectorAll(sel)));
        });

        DYNAMIC.forEach(function (cfg) {
            var box = document.querySelector(cfg.sel);
            if (!box) return;
            var seeded = false;
            var apply = function () {
                var kids = Array.prototype.filter.call(box.children, function (n) {
                    return n.nodeType === 1 && !n.classList.contains('cargando');
                });
                if (!kids.length) return;
                if (cfg.once && seeded) return; // filas que se re-pintan: sin animación
                seeded = true;
                markGroup(kids);
            };
            apply();
            new MutationObserver(apply).observe(box, { childList: true });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
