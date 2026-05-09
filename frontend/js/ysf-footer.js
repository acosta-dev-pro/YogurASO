/* ysf-footer.js — Aquí queda el pie: el año y la entrada al bajar. */
(function () {
  'use strict';

  function init() {
    var root = document.querySelector('[data-ysf]');
    if (!root || root.getAttribute('data-ysf-ready')) return;
    root.setAttribute('data-ysf-ready', '1');

    var year = root.querySelector('[data-ysf-year]');
    if (year) year.textContent = String(new Date().getFullYear());

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;

    var items = root.querySelectorAll('.ysf-rv');
    if (!items.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // Reveal when visible, or if it is already above the viewport (restored scroll).
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) show(e.target);
      });
    }, { threshold: 0.15 });

    function show(el) {
      el.classList.add('ysf-on');
      io.unobserve(el);
    }

    // Keyboard users tabbing into the footer never meet hidden content.
    root.addEventListener('focusin', function () {
      for (var i = 0; i < items.length; i++) show(items[i]);
    });

    root.classList.add('ysf--js');
    for (var i = 0; i < items.length; i++) io.observe(items[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
