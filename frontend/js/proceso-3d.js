/* Proceso: entrada sutil de la tarjeta y la botella al entrar en pantalla. */
(function () {
    'use strict';
    var root = document.querySelector('[data-p3d]');
    if (!root) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) { root.classList.add('is-in'); return; }
    root.classList.add('is-js');
    var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) { root.classList.add('is-in'); io.disconnect(); break; }
        }
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    io.observe(root);
})();
