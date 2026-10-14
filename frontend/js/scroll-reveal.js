/* scroll-reveal.js — Aquí queda la entrada suave al hacer scroll.
   Cuando una tarjeta o un título entra en pantalla, aparece.
   Si la persona pidió menos movimiento, no hace nada.
   Estilos: css/motion.css (.reveal-start / .reveal-show). */
(function () {
    'use strict';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function start() {
        var items = document.querySelectorAll('.beneficio-card, .pastel-card, .nosotros-content, .nosotros-visual, .ns-process-card, .section-title, .productos-masonry .producto-card');
        if (!items.length || !('IntersectionObserver' in window)) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('reveal-show');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.16 });

        Array.prototype.forEach.call(items, function (el) {
            el.classList.add('reveal-start');
            observer.observe(el);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
