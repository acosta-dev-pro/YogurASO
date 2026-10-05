/**
 * hero.js — Portada YoguraSo: cambio de sabor sin selector.
 * - Lo único que cambia es el fondo (CSS, body[data-flavor]) y las botellas, que se funden en su mismo sitio.
 *   Título, subtítulo, botón, logo y menú no se mueven ni se recargan.
 * - Cambio automático cada ~5,5 s; el anillo del botón de pausa marca el tiempo (su animationend avanza).
 * - Toque o clic en las botellas = siguiente; deslizar = siguiente/anterior; flechas ← → con foco en las botellas.
 * - Se detiene solo con la pestaña oculta, el hero fuera de vista o el foco del teclado dentro de las botellas.
 * - prefers-reduced-motion: sin cambio automático (arranca en pausa) y fundidos cortos.
 * Datos de sabores: js/flavors.js · Colores: css/hero.css
 */
(function () {
    'use strict';

    var FLAVORS = window.YOGUR_FLAVORS;
    var hero = document.getElementById('hero');
    if (!FLAVORS || !FLAVORS.length || !hero) return;

    var INTERVAL = 5500;
    var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    var base = 'assets/products/yoguraso-';
    var MAIN_SIZES = '(max-width: 860px) 46vw, 23vw';
    var body = document.body;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    var stage = document.getElementById('hero-stage');
    var pauseBtn = document.getElementById('hero-pause');
    var live = document.getElementById('hero-live');
    var ring = pauseBtn && pauseBtn.querySelector('.hero-pause-progress');
    var themeMeta = document.querySelector('meta[name="theme-color"]');

    function src(slug, small) { return base + slug + '-500ml' + (small ? '-sm' : '') + '.webp'; }
    function mainSet(slug) { return src(slug, true) + ' 320w, ' + src(slug) + ' 640w'; }

    function makeSlot(sel, isMain) {
        var el = hero.querySelector(sel);
        return { isMain: isMain, imgs: el ? [].slice.call(el.querySelectorAll('.bottle-img')) : [] };
    }
    var slots = [makeSlot('.bottle--main', true), makeSlot('.bottle--second', false)];

    var current = 0, swapId = 0;
    var userPaused = reduce.matches, hidden = document.hidden, offscreen = false, focusHold = false;

    /* ---------- Imágenes ---------- */
    var cache = {};
    function load(slug, isMain) {
        var key = slug + (isMain ? ':m' : ':s');
        if (!cache[key]) {
            cache[key] = new Promise(function (resolve) {
                var im = new Image();
                if (isMain) { im.sizes = MAIN_SIZES; im.srcset = mainSet(slug); }
                im.src = src(slug, !isMain);
                if (im.decode) im.decode().then(resolve, resolve);
                else im.onload = im.onerror = resolve;
            });
        }
        return cache[key];
    }
    function fill(img, flavor, isMain) {
        if (isMain) { img.sizes = MAIN_SIZES; img.srcset = mainSet(flavor.slug); }
        img.src = src(flavor.slug, !isMain);
    }

    function anim(el, frames, opts) {
        if (!el.animate) return { finished: Promise.resolve(), cancel: function () {} };
        return el.animate(frames, opts);
    }

    /* Fundido en capas: la botella que sale baja la opacidad con una escala mínima;
       la nueva aparece en el mismo sitio. Nada se desplaza de lado. */
    function crossfade(slot, flavor, delay, id) {
        return load(flavor.slug, slot.isMain).then(function () {
            if (id !== swapId || slot.imgs.length < 2) return;
            var on = slot.imgs[0].classList.contains('is-on') ? slot.imgs[0] : slot.imgs[1];
            var off = on === slot.imgs[0] ? slot.imgs[1] : slot.imgs[0];
            fill(off, flavor, slot.isMain);
            var go = function () {
                if (id !== swapId) return;
                var fast = reduce.matches;
                on.getAnimations && on.getAnimations().forEach(function (a) { a.cancel(); });
                off.getAnimations && off.getAnimations().forEach(function (a) { a.cancel(); });
                off.classList.add('is-on');
                on.classList.remove('is-on');
                anim(on, fast ? [{ opacity: 1 }, { opacity: 0 }] : [
                    { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
                    { opacity: 0, transform: 'scale(0.965)', filter: 'blur(2px)' }
                ], { duration: fast ? 180 : 620, delay: delay, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'backwards' });
                anim(off, fast ? [{ opacity: 0 }, { opacity: 1 }] : [
                    { opacity: 0, transform: 'scale(1.025)', filter: 'blur(3px)' },
                    { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }
                ], { duration: fast ? 220 : 820, delay: delay + (fast ? 0 : 140), easing: EASE, fill: 'backwards' });
                slot.imgs[0].alt = '';
                slot.imgs[1].alt = '';
                if (slot.isMain) off.alt = flavor.alt;
            };
            if (off.decode) off.decode().then(go, go); else go();
        });
    }

    /* ---------- Cambio de sabor ---------- */
    function setTheme(flavor) {
        body.dataset.flavor = flavor.slug;
        body.dataset.heroFg = 'light';          // logo y textos siempre blancos
        if (themeMeta) {
            var c = getComputedStyle(body).getPropertyValue('--hero-bg').trim();
            if (c) themeMeta.content = c;
        }
    }

    function show(i, opts) {
        var n = (i + FLAVORS.length) % FLAVORS.length;
        if (n === current && !(opts && opts.force)) return;
        var flavor = FLAVORS[n];
        var next = FLAVORS[(n + 1) % FLAVORS.length];
        var id = ++swapId;
        current = n;
        setTheme(flavor);
        crossfade(slots[0], flavor, 0, id);
        crossfade(slots[1], next, 90, id);
        if (stage) stage.setAttribute('aria-label', flavor.nombre + '. Usa las flechas izquierda y derecha para cambiar de sabor');
        if (live && opts && opts.announce) live.textContent = 'Sabor ' + flavor.nombre;
        restartTimer();
    }
    function step(d, announce) { show(current + d, { announce: announce }); }

    /* ---------- Cambio automático con el anillo como reloj ---------- */
    function held() { return userPaused || hidden || offscreen || focusHold; }
    function restartTimer() {
        if (!pauseBtn) return;
        pauseBtn.classList.remove('is-running');
        if (userPaused) return;
        void pauseBtn.offsetWidth;              // reinicia la animación del anillo
        pauseBtn.classList.add('is-running');
        syncHold();
    }
    function syncHold() {
        if (!pauseBtn) return;
        pauseBtn.classList.toggle('is-held', held());
    }
    function setUserPaused(p) {
        userPaused = p;
        pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', p ? 'Reanudar el cambio automático de sabores' : 'Pausar el cambio automático de sabores');
        if (p) pauseBtn.classList.remove('is-running', 'is-held');
        else restartTimer();
    }
    if (pauseBtn) {
        pauseBtn.style.setProperty('--hero-interval', INTERVAL + 'ms');
        pauseBtn.addEventListener('click', function () { setUserPaused(!userPaused); });
        if (ring) ring.addEventListener('animationend', function (e) {
            if (e.animationName === 'heroRing' && !held()) step(1, false);
        });
        setUserPaused(userPaused);
    }
    document.addEventListener('visibilitychange', function () { hidden = document.hidden; syncHold(); });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            offscreen = !entries[0].isIntersecting;
            syncHold();
        }, { threshold: 0.35 }).observe(hero);
    }
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) setUserPaused(true); });

    /* ---------- Teclado, toque y deslizamiento ---------- */
    if (stage) {
        stage.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') step(1, true);
            else if (e.key === 'ArrowLeft') step(-1, true);
            else if (e.key === 'Home') show(0, { announce: true });
            else if (e.key === 'End') show(FLAVORS.length - 1, { announce: true });
            else return;
            e.preventDefault();
        });
        stage.addEventListener('focusin', function () { if (stage.matches(':focus-visible')) { focusHold = true; syncHold(); } });
        stage.addEventListener('focusout', function () { focusHold = false; syncHold(); });

        var x0 = null, y0 = 0, swiped = false;
        stage.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            x0 = e.clientX; y0 = e.clientY; swiped = false;
        });
        window.addEventListener('pointerup', function (e) {
            if (x0 === null) return;
            var dx = e.clientX - x0, dy = e.clientY - y0;
            x0 = null;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                swiped = true;
                step(dx < 0 ? 1 : -1, true);
            }
        });
        window.addEventListener('pointercancel', function () { x0 = null; });
        stage.addEventListener('click', function () {
            if (swiped) { swiped = false; return; }
            step(1, true);
        });
    }

    /* ---------- Menú: barra crema al bajar del hero ---------- */
    var header = document.getElementById('siteHeader');
    if (header) {
        var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 24); };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---------- Precarga del resto de sabores cuando el navegador está libre ---------- */
    function idle(fn, ms) {
        if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 });
        else window.setTimeout(fn, ms);
    }
    function warm() {
        if (navigator.connection && navigator.connection.saveData) return;
        var order = [];
        for (var k = 1; k <= FLAVORS.length; k++) order.push(FLAVORS[(current + k) % FLAVORS.length]);
        (function next() {
            var f = order.shift();
            if (!f) return;
            load(f.slug, true).then(function () { return load(f.slug, false); }).then(function () { idle(next, 150); });
        })();
    }

    /* ---------- Arranque ---------- */
    // Enlace directo a un sabor: index.html?sabor=mora
    var start = 0;
    try {
        var q = new URLSearchParams(location.search).get('sabor');
        for (var n = 0; q && n < FLAVORS.length; n++) { if (FLAVORS[n].slug === q) { start = n; break; } }
    } catch (err) { /* sin soporte: arranca en Fresa */ }

    setTheme(FLAVORS[start]);
    if (start !== 0) {
        current = start;
        var f0 = FLAVORS[start], f1 = FLAVORS[(start + 1) % FLAVORS.length];
        fill(slots[0].imgs[0], f0, true); slots[0].imgs[0].alt = f0.alt;
        fill(slots[1].imgs[0], f1, false);
        if (stage) stage.setAttribute('aria-label', f0.nombre + '. Usa las flechas izquierda y derecha para cambiar de sabor');
    }
    requestAnimationFrame(function () {
        hero.classList.remove('is-loading');
        // tras la entrada, las capas quedan libres para los fundidos
        setTimeout(function () { hero.classList.add('is-ready'); }, 1100);
    });
    if (document.readyState === 'complete') idle(warm, 600); else window.addEventListener('load', function () { idle(warm, 600); });
})();
