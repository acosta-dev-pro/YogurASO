/* yogurt-drip.js — activa el goteo cremoso entre secciones al entrar en vista.
   No toca hero ni header. Respeta prefers-reduced-motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function arm() {
    var nodes = document.querySelectorAll('.yd');
    if (!nodes.length) return;
    if (reduce.matches || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-live'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('is-live');
        else e.target.classList.remove('is-live');
      });
    }, { rootMargin: '10% 0px', threshold: 0.05 });
    nodes.forEach(function (n) { io.observe(n); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm);
  else arm();
})();
