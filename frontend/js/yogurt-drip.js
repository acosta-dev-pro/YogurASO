/* yogurt-drip.js — labio crema estático entre secciones.
   Sin goteo animado (se veía desorganizado). Respeta prefers-reduced-motion. */
(function () {
  'use strict';
  function arm() {
    document.querySelectorAll('.yd').forEach(function (n) {
      n.classList.add('is-live');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm);
  else arm();
})();