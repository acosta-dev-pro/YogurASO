/* Collage "Fruta real": entrada escalonada de tiles con IntersectionObserver. */
(function () {
    'use strict';
    var root = document.querySelector('[data-fcol]');
    if (!root) return;
    var tiles = Array.prototype.slice.call(root.querySelectorAll('.fcol__tile'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    tiles.forEach(function (t, i) { t.style.setProperty('--i', i % 4); });
    root.classList.add('is-ready');
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    tiles.forEach(function (t) { io.observe(t); });
})();
