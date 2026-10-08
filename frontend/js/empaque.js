/* empaque.js — sección Empaque del home (estilo anatomía).
   - Muestra temperatura / material solo si están en js/product-info.js (no se inventan datos).
   - El video de la botella se pausa fuera de pantalla y no corre con "reducir movimiento". */
(function () {
    var sec = document.getElementById('empaque');
    if (!sec) return;
    var I = window.YOG_INFO || {};
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    sec.querySelectorAll('[data-info]').forEach(function (el) {
        var v = I[el.getAttribute('data-info')];
        var label = el.getAttribute('data-label');
        if (v) { el.innerHTML = (label ? '<b>' + esc(label) + ':</b> ' : '') + esc(v); el.hidden = false; }
        else el.hidden = true;
    });

    var video = sec.querySelector('.emp__video');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

    function stillPoster() {
        if (!video) return;
        video.pause();
        video.removeAttribute('autoplay');
        video.preload = 'none';
        video.load(); // vuelve a mostrar el póster
    }
    if (video && reduce && reduce.matches) stillPoster();
    if (reduce && reduce.addEventListener) reduce.addEventListener('change', function (e) { if (e.matches) stillPoster(); });

    sec.classList.add('is-js');
    if (!('IntersectionObserver' in window)) { sec.classList.add('is-in'); return; }
    new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) { if (en.isIntersecting) { sec.classList.add('is-in'); obs.disconnect(); } });
    }, { threshold: 0.2 }).observe(sec);

    if (video) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (reduce && reduce.matches) return;
                if (en.isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
                else video.pause();
            });
        }, { threshold: 0.05 }).observe(video);
    }
})();
