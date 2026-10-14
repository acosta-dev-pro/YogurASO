/* collage-fruta.js — Aquí queda la entrada del collage de fruta al bajar. */
(function () {
    'use strict';
    var root = document.querySelector('[data-fcol]');
    if (!root) return;
    var tiles = Array.prototype.slice.call(root.querySelectorAll('.fcol__tile'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    tiles.forEach(function (t, i) { t.style.setProperty('--i', i % 4); });
    root.classList.add('is-ready');
    var pending = tiles.length;
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('is-in');
            io.unobserve(e.target);
            pending -= 1;
        });
    }, { threshold: 0.01, rootMargin: '160px 0px 80px 0px' });
    tiles.forEach(function (t) { io.observe(t); });
    /* En el celular el observer a veces no dispara y las tarjetas se quedan invisibles. */
    window.setTimeout(function () {
        if (!pending) return;
        tiles.forEach(function (t) { t.classList.add('is-in'); });
    }, 700);
})();
