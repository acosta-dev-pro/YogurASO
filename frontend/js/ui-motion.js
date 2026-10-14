/* ui-motion.js — Aquí queda el número del carrito contando de uno en uno, y el retardo entre tarjetas hermanas. */
(function () {
    'use strict';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    var badge = document.getElementById('cart-count');
    if (badge && 'MutationObserver' in window) {
        var shown = Number(badge.textContent) || 0;
        var busy = false;
        new MutationObserver(function () {
            if (busy) return;
            var target = Number(badge.textContent);
            if (!Number.isFinite(target) || target === shown) return;
            var from = shown;
            shown = target;
            if (reduce.matches) return;
            busy = true;
            var steps = Math.min(Math.abs(target - from), 8);
            var n = 0;
            (function tick() {
                n++;
                badge.textContent = String(Math.round(from + (target - from) * (n / steps)));
                badge.classList.remove('is-counting');
                void badge.offsetWidth;
                badge.classList.add('is-counting');
                if (n < steps) setTimeout(tick, 55);
                else setTimeout(function () { busy = false; }, 0);
            })();
        }).observe(badge, { childList: true, characterData: true, subtree: true });
    }

    document.querySelectorAll('.beneficios-grid, .nosotros-grid').forEach(function (group) {
        Array.prototype.forEach.call(group.children, function (el, i) { el.style.setProperty('--i', i); });
    });
})();
