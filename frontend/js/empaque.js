/* empaque.js — Aquí queda la sección Empaque.
   Solo muestra temperatura y material si están escritos en product-info.js. */
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
    var shown = false;
    function show() { if (shown) return; shown = true; sec.classList.add('is-in'); }
    if (!('IntersectionObserver' in window)) { show(); return; }
    new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) { if (en.isIntersecting) { show(); obs.disconnect(); } });
    }, { threshold: 0.01, rootMargin: '120px 0px 80px 0px' }).observe(sec);
    window.setTimeout(show, 900);

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
