/**
 * hero.js — Portada con selector de sabores.
 * Cambia a la vez: botella principal, botella de atrás (el siguiente sabor), fondo, textos y acentos.
 * Fondo y colores los hace CSS (body[data-flavor]); aquí solo se mueve el contenido y las animaciones.
 * Respeta prefers-reduced-motion (cambio casi instantáneo, sin desplazamientos).
 * Datos de sabores: js/flavors.js
 */
(function () {
    'use strict';

    var FLAVORS = window.YOGUR_FLAVORS;
    var hero = document.getElementById('hero');
    if (!FLAVORS || !FLAVORS.length || !hero) return;

    var body = document.body;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var base = 'assets/products/yoguraso-';
    var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

    // Cada sabor entra con su propio gesto: giro suave, de qué lado llega y qué tanto sube.
    var ENTRY = {
        'fresa':        { rot: -5, x: -26, y: 22 },
        'pina':         { rot:  6, x:  28, y: 20 },
        'mora':         { rot: -4, x: -20, y: 28 },
        'melocoton':    { rot:  5, x:  24, y: 18 },
        'frutos-rojos': { rot: -6, x: -28, y: 22 },
        'cafe':         { rot:  3, x:  16, y: 30 },
        'guanabana':    { rot: -5, x: -22, y: 20 },
        'mango':        { rot:  6, x:  26, y: 24 }
    };
    // Sabores con fondo claro llevan texto y logo oscuros
    var DARK_TEXT = { 'pina': true, 'mango': true };

    var els = {
        title: hero.querySelector('.hero-title'),
        sub: hero.querySelector('.hero-sub'),
        cta: hero.querySelector('.hero-cta'),
        ctaImg: hero.querySelector('.hero-cta-icon img'),
        stage: hero.querySelector('.hero-stage'),
        main: hero.querySelector('.bottle--main'),
        second: hero.querySelector('.bottle--second'),
        group: document.getElementById('flavor-selector'),
        live: document.getElementById('hero-live')
    };

    var current = 0;
    var swapId = 0;
    var pills = [];

    function src(slug, small) { return base + slug + '-500ml' + (small ? '-sm' : '') + '.webp'; }
    function mainSet(slug) { return src(slug, true) + ' 320w, ' + src(slug) + ' 640w'; }
    var MAIN_SIZES = '(max-width: 860px) 46vw, 26vw';

    function slot(el) {
        return {
            el: el,
            art: el.querySelector('.bottle-art'),
            imgs: el.querySelectorAll('img')
        };
    }
    var mainSlot = slot(els.main);
    var secondSlot = slot(els.second);

    function setImages(s, flavor, isMain) {
        for (var i = 0; i < s.imgs.length; i++) {
            var img = s.imgs[i];
            if (isMain) {
                img.sizes = MAIN_SIZES;
                img.srcset = mainSet(flavor.slug);
            }
            img.src = src(flavor.slug, !isMain || false);
            if (!isMain) img.removeAttribute('srcset');
        }
        s.imgs[0].alt = isMain ? flavor.alt : '';
    }

    function preload(flavor, isMain) {
        return new Promise(function (resolve) {
            var im = new Image();
            if (isMain) { im.sizes = MAIN_SIZES; im.srcset = mainSet(flavor.slug); }
            im.src = src(flavor.slug, !isMain);
            if (im.decode) { im.decode().then(resolve, resolve); }
            else { im.onload = im.onerror = function () { resolve(); }; }
        });
    }

    function animate(el, frames, opts) {
        if (!el || !el.animate) return { finished: Promise.resolve(), cancel: function () {} };
        return el.animate(frames, opts);
    }

    /* Mueve texto en cascada: fade + subida de 16 px, 0,42 s, escalonado de 90 ms */
    function staggerCopy() {
        if (reduce.matches) return;
        [els.title, els.sub, els.cta].forEach(function (el, i) {
            animate(el, [
                { opacity: i === 0 ? 0.35 : 0, transform: 'translateY(16px)' },
                { opacity: 1, transform: 'none' }
            ], { duration: 420, delay: i * 90, easing: EASE, fill: 'backwards' });
        });
    }

    function swapBottle(s, flavor, isMain, delay, id) {
        var e = ENTRY[flavor.slug] || { rot: 4, x: 20, y: 20 };
        var k = isMain ? 1 : 0.6;
        var fast = reduce.matches;
        return preload(flavor, isMain).then(function () {
            if (id !== swapId) return;
            var out = animate(s.art, [
                { opacity: 1, transform: 'none' },
                { opacity: 0, transform: fast ? 'none' : 'translateY(10px) scale(0.97)' }
            ], { duration: fast ? 120 : 220, easing: 'ease-in', fill: 'forwards' });
            return out.finished.then(function () {
                if (id !== swapId) { out.cancel(); return; }
                setImages(s, flavor, isMain);
                var enter = fast
                    ? [{ opacity: 0 }, { opacity: 1 }]
                    : [
                        { opacity: 0, transform: 'translate(' + (e.x * k) + 'px,' + (e.y * k) + 'px) rotate(' + (e.rot * k) + 'deg) scale(0.93)' },
                        { opacity: 1, transform: 'none' }
                    ];
                animate(s.art, enter, { duration: fast ? 160 : 640, delay: fast ? 0 : delay, easing: EASE, fill: 'backwards' });
                out.cancel();
            });
        });
    }

    function render(i, animateIt) {
        var flavor = FLAVORS[i];
        var next = FLAVORS[(i + 1) % FLAVORS.length];
        var id = ++swapId;
        current = i;

        body.dataset.flavor = flavor.slug;
        body.dataset.heroFg = DARK_TEXT[flavor.slug] ? 'dark' : 'light';
        document.querySelector('meta[name="theme-color"]') && (document.querySelector('meta[name="theme-color"]').content =
            getComputedStyle(body).getPropertyValue('--hero-bg').trim() || '#BE1E2A');

        pills.forEach(function (p, n) {
            var on = n === i;
            p.setAttribute('aria-checked', on ? 'true' : 'false');
            p.tabIndex = on ? 0 : -1;
        });
        var active = pills[i];
        if (active && els.group && els.group.scrollWidth > els.group.clientWidth) {
            // la píldora activa se ensancha en 0,4 s: se centra cuando ya tiene su tamaño final
            clearTimeout(render.scrollT);
            render.scrollT = setTimeout(function () {
                var left = active.offsetLeft - (els.group.clientWidth - active.offsetWidth) / 2;
                els.group.scrollTo({ left: left, behavior: reduce.matches ? 'auto' : 'smooth' });
            }, animateIt === false ? 0 : 420);
        }

        els.second.setAttribute('aria-label', 'Ver el sabor ' + next.nombre);
        els.cta.setAttribute('href', els.cta.getAttribute('href').split('?')[0]);
        if (els.ctaImg) { els.ctaImg.src = src(flavor.slug, true); }
        if (els.live) els.live.textContent = 'Sabor ' + flavor.nombre;

        if (animateIt === false) {
            setImages(mainSlot, flavor, true);
            setImages(secondSlot, next, false);
            return;
        }
        staggerCopy();
        swapBottle(mainSlot, flavor, true, 0, id);
        swapBottle(secondSlot, next, false, 130, id);
    }

    function go(i) {
        var n = (i + FLAVORS.length) % FLAVORS.length;
        if (n === current) return;
        render(n, true);
    }

    /* Selector: grupo de opciones con flechas del teclado, Inicio y Fin */
    function buildPills() {
        if (!els.group) return;
        els.group.textContent = '';
        FLAVORS.forEach(function (f, i) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'flavor-pill';
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-label', f.nombre);
            b.style.setProperty('--dot', f.dot);
            b.innerHTML = '<span class="flavor-dot" aria-hidden="true"></span><span class="flavor-name" aria-hidden="true"></span>';
            b.lastChild.textContent = f.nombre;
            b.addEventListener('click', function () { go(i); });
            els.group.appendChild(b);
            pills.push(b);
        });
        els.group.addEventListener('keydown', function (e) {
            var d = 0;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = 1;
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') d = -1;
            else if (e.key === 'Home') d = -current;
            else if (e.key === 'End') d = FLAVORS.length - 1 - current;
            else return;
            e.preventDefault();
            go(current + d);
            pills[current].focus();
        });
    }

    /* Táctil y ratón: arrastre horizontal sobre la botella cambia de sabor */
    function bindSwipe() {
        var x0 = null, y0 = 0, moved = false;
        els.stage.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            x0 = e.clientX; y0 = e.clientY; moved = false;
        });
        window.addEventListener('pointerup', function (e) {
            if (x0 === null) return;
            var dx = e.clientX - x0, dy = e.clientY - y0;
            x0 = null;
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                moved = true;
                go(current + (dx < 0 ? 1 : -1));
            }
        });
        window.addEventListener('pointercancel', function () { x0 = null; });
        els.second.addEventListener('click', function (e) {
            if (moved) { moved = false; e.preventDefault(); return; }
            go(current + 1);
        });
    }

    function idle(fn, ms) {
        if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 });
        else window.setTimeout(fn, ms);
    }

    /* Precarga las demás botellas cuando el navegador está libre */
    function warm() {
        if (navigator.connection && navigator.connection.saveData) return;
        var queue = FLAVORS.slice(1);
        function step() {
            var f = queue.shift();
            if (!f) return;
            preload(f, true).then(function () { return preload(f, false); }).then(function () {
                idle(step, 200);
            });
        }
        idle(step, 600);
    }

    /* Menú: barra crema cuando se baja del hero */
    function bindHeader() {
        var header = document.getElementById('siteHeader');
        if (!header) return;
        function onScroll() { header.classList.toggle('is-stuck', window.scrollY > 24); }
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Enlace directo a un sabor: index.html?sabor=mora
    try {
        var q = new URLSearchParams(location.search).get('sabor');
        for (var n = 0; q && n < FLAVORS.length; n++) { if (FLAVORS[n].slug === q) { current = n; break; } }
    } catch (err) { /* sin soporte: arranca en Fresa */ }

    /* Inclinación 3D leve de las botellas con el cursor (solo escritorio con ratón, sin movimiento reducido).
       Solo cambia dos variables CSS; en celular y con movimiento reducido no se activa. */
    function bindTilt() {
        var fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 861px)');
        if (!fine.matches || reduce.matches) return;
        var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
        function loop() {
            cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
            hero.style.setProperty('--tilt-x', cx.toFixed(2));
            hero.style.setProperty('--tilt-y', cy.toFixed(2));
            raf = (Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02) ? requestAnimationFrame(loop) : 0;
        }
        hero.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'mouse') return;
            var r = hero.getBoundingClientRect();
            tx = ((e.clientX - r.left) / r.width - 0.5) * 9;   // máx. ±4,5°
            ty = ((e.clientY - r.top) / r.height - 0.5) * -5;  // máx. ±2,5°
            if (!raf) raf = requestAnimationFrame(loop);
        });
        hero.addEventListener('pointerleave', function () {
            tx = 0; ty = 0;
            if (!raf) raf = requestAnimationFrame(loop);
        });
    }

    buildPills();
    bindTilt();
    bindSwipe();
    bindHeader();
    render(current, false);
    // El HTML ya trae Fresa y Piña; se quita el estado de carga y arranca la entrada
    requestAnimationFrame(function () { hero.classList.remove('is-loading'); });
    if (document.readyState === 'complete') warm(); else window.addEventListener('load', warm);
})();
