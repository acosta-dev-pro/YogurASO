/* depth.js — scroll con profundidad 3D y formas orgánicas de yogurt bajo el hero.
   - Escritorio (≥ 861 px y mouse): el contenido de cada sección entra inclinado y desde el fondo
     (rotateX + translateZ) y termina plano; las formas se mueven a distinta velocidad según su
     profundidad y siguen un poco el mouse.
   - Celular / táctil: versión 2D, solo un parallax vertical suave y menos formas.
   - prefers-reduced-motion: formas quietas, sin parallax ni inclinación.
   Solo se animan transform y opacity, con un único requestAnimationFrame que se detiene en reposo.
   No toca el hero ni el header. */
(function () {
    'use strict';
    var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var mq3d = window.matchMedia('(min-width: 861px) and (pointer: fine)');
    var root = document.documentElement;

    /* Formas por sección. x/y en % de la sección (pueden salirse un poco), s = tamaño en px,
       d = profundidad (más alto = más cerca y más rápido), t = tipo, c = tono, m = también en móvil. */
    var LAYOUT = {
        sabores:      [{ t: 'dollop', x: 91, y: 8, s: 120, d: 1.1, c: 'pink', r: 18, m: 1 }, { t: 'drop', x: 4, y: 74, s: 34, d: 1.6, c: 'pink' }, { t: 'bubbles', x: 88, y: 84, s: 70, d: 0.7, c: 'cream' }],
        beneficios:   [{ t: 'drop', x: 93, y: 22, s: 30, d: 1.5, c: 'cream', m: 1 }, { t: 'dollop', x: -3, y: 62, s: 96, d: 0.8, c: 'cream' }],
        proceso:      [{ t: 'swirl', x: 95, y: 14, s: 150, d: 0.9, c: 'cream', r: -12, m: 1 }, { t: 'drop', x: 3, y: 30, s: 28, d: 1.7, c: 'pink' }, { t: 'bubbles', x: 6, y: 80, s: 64, d: 0.6, c: 'cream' }],
        empaque:      [{ t: 'dollop', x: 5, y: 86, s: 110, d: 1.2, c: 'white', r: -20, m: 1 }, { t: 'drop', x: 52, y: 12, s: 26, d: 1.8, c: 'white' }, { t: 'bubbles', x: 94, y: 22, s: 72, d: 0.8, c: 'white' }],
        conservacion: [{ t: 'drop', x: 92, y: 30, s: 32, d: 1.5, c: 'sky', m: 1 }, { t: 'swirl', x: -4, y: 70, s: 130, d: 0.8, c: 'sky', r: 30 }],
        ideas:        [{ t: 'swirl', x: 96, y: 78, s: 140, d: 1.0, c: 'white', r: 10, m: 1 }, { t: 'drop', x: 4, y: 22, s: 30, d: 1.6, c: 'pink' }, { t: 'bubbles', x: 2, y: 84, s: 66, d: 0.7, c: 'white' }],
        nosotros:     [{ t: 'dollop', x: 94, y: 12, s: 100, d: 1.0, c: 'pink', r: 24, m: 1 }, { t: 'drop', x: 3, y: 80, s: 28, d: 1.6, c: 'pink' }],
        'main-content': [{ t: 'drop', x: 95, y: 30, s: 30, d: 1.5, c: 'white', m: 1 }, { t: 'bubbles', x: 3, y: 18, s: 70, d: 0.8, c: 'white' }],
        faq:          [{ t: 'swirl', x: -5, y: 78, s: 150, d: 0.9, c: 'cream', r: -18, m: 1 }, { t: 'drop', x: 30, y: 92, s: 26, d: 1.6, c: 'pink' }]
    };
    /* Goteo de yogurt en el borde superior: color de la sección anterior escurriendo sobre esta. */
    var DRIPS = { empaque: '#FFFFFF', ideas: '#FFFFFF', 'main-content': '#FFFFFF' };

    function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }

    var DRIP_PATH = 'M0 0H1440V14H1366C1351.7 14 1356.1 44 1340 44C1323.9 44 1328.3 14 1314 14H1228C1207.1 14 1213.6 70 1190 70C1166.4 70 1172.9 14 1152 14H1070C1059.0 14 1062.4 30 1050 30C1037.6 30 1041.0 14 1030 14H910C893.5 14 898.6 54 880 54C861.4 54 866.5 14 850 14H759C745.8 14 749.9 40 735 40C720.1 40 724.2 14 711 14H600C578.0 14 584.8 76 560 76C535.2 76 542.0 14 520 14H442C429.9 14 433.6 32 420 32C406.4 32 410.1 14 398 14H284C265.3 14 271.1 62 250 62C228.9 62 234.7 14 216 14H116C101.7 14 106.1 36 90 36C73.9 36 78.3 14 64 14H0Z';

    var sections = [];
    function build() {
        Object.keys(LAYOUT).forEach(function (id) {
            var sec = document.getElementById(id);
            if (!sec || sec.querySelector(':scope > .yg-deco')) return;
            sec.classList.add('yg-host');
            var deco = el('div', 'yg-deco'); deco.setAttribute('aria-hidden', 'true');
            var shapes = LAYOUT[id].map(function (o, i) {
                var s = el('span', 'yg-s yg-' + o.t + ' yg-c-' + o.c + (o.m ? '' : ' yg-nm'));
                s.style.cssText = 'left:' + o.x + '%;top:' + o.y + '%;--s:' + o.s + 'px;--r:' + (o.r || 0) + 'deg;--dl:' + (-i * 2.3).toFixed(1) + 's;--dur:' + (9 + o.d * 3).toFixed(1) + 's';
                var inner = el('b'); s.appendChild(inner);
                if (o.t === 'bubbles') { for (var k = 0; k < 5; k++) inner.appendChild(el('i')); }
                deco.appendChild(s);
                return { node: s, d: o.d };
            });
            sec.insertBefore(deco, sec.firstChild);
            if (DRIPS[id]) {
                var drip = el('div', 'yg-drip'); drip.setAttribute('aria-hidden', 'true');
                drip.innerHTML = '<svg viewBox="0 0 1440 80" preserveAspectRatio="none" focusable="false"><path fill="' + DRIPS[id] + '" d="' + DRIP_PATH + '"/></svg>' +
                    '<i style="left:38.9%;top:93%;--dl:0s"></i><i style="left:82.6%;top:86%;--dl:-2.6s"></i><i style="left:17.4%;top:76%;--dl:-4.4s"></i>';
                drip.querySelectorAll('i').forEach(function (d) { d.style.background = DRIPS[id]; });
                sec.insertBefore(drip, deco.nextSibling);
            }
            /* Contenido que recibe la profundidad: hijos directos en el flujo (no decoraciones). */
            var content = Array.prototype.filter.call(sec.children, function (c) {
                if (/\byg-(deco|drip)\b|\bsx-shapes\b|nosotros-bg-pattern/.test(c.className)) return false;
                return getComputedStyle(c).position !== 'absolute';
            });
            content.forEach(function (c) { c.classList.add('yg-z'); });
            sections.push({ sec: sec, shapes: shapes, content: content, on: false, flat: false });
        });
    }

    /* ---------- Bucle de animación ---------- */
    var mode = 'off', raf = 0, mx = 0, my = 0, cx = 0, cy = 0;
    function setMode() {
        mode = mqReduce.matches ? 'off' : (mq3d.matches ? '3d' : '2d');
        root.classList.toggle('yg-3d', mode === '3d');
        root.classList.toggle('yg-2d', mode === '2d');
        root.classList.toggle('yg-still', mode === 'off');
        sections.forEach(function (o) {
            o.flat = false;
            o.content.forEach(function (c) { c.style.transform = ''; });
            o.shapes.forEach(function (s) { s.node.style.transform = ''; });
        });
        kick();
    }
    function kick() { if (!raf && mode !== 'off') raf = requestAnimationFrame(frame); }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function frame() {
        raf = 0;
        var vh = window.innerHeight, moving = false;
        if (mode === '3d') {
            cx += (mx - cx) * 0.08; cy += (my - cy) * 0.08;
            if (Math.abs(mx - cx) > 0.001 || Math.abs(my - cy) > 0.001) moving = true;
        }
        for (var i = 0; i < sections.length; i++) {
            var o = sections[i];
            if (!o.on) continue;
            var r = o.sec.getBoundingClientRect();
            var c = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2); // -1 (arriba) … 1 (abajo)
            if (c > 1.2 || c < -1.2) continue;
            var k = mode === '3d' ? 1 : 0.4;
            for (var j = 0; j < o.shapes.length; j++) {
                var sh = o.shapes[j], d = sh.d;
                var ty = c * d * 62 * k, tx = mode === '3d' ? cx * d * 9 : 0, ry = mode === '3d' ? cy * d * 6 : 0;
                sh.node.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + (ty + ry).toFixed(1) + 'px,0) rotate(' + (c * d * 5).toFixed(2) + 'deg)';
            }
            if (mode === '3d') {
                var e = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.62)));
                if (e < 1) {
                    var q = 1 - easeOut(e);
                    /* Inclinación sutil: máx. 5° y 60 px hacia el fondo (antes 9° y 110 px). */
                    var tf = 'translate3d(0,' + (q * 22).toFixed(1) + 'px,' + (-q * 60).toFixed(1) + 'px) rotateX(' + (q * 5).toFixed(2) + 'deg)';
                    for (var m = 0; m < o.content.length; m++) o.content[m].style.transform = tf;
                    o.flat = false;
                } else if (!o.flat) {
                    for (var n = 0; n < o.content.length; n++) o.content[n].style.transform = '';
                    o.flat = true;
                }
            }
        }
        if (moving) kick();
    }

    function init() {
        build();
        if (!sections.length) return;
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                for (var i = 0; i < sections.length; i++) if (sections[i].sec === e.target) sections[i].on = e.isIntersecting;
                e.target.classList.toggle('yg-live', e.isIntersecting);
            });
            kick();
        }, { rootMargin: '25% 0px 25% 0px' });
        sections.forEach(function (o) { io.observe(o.sec); });
        window.addEventListener('scroll', kick, { passive: true });
        window.addEventListener('resize', kick, { passive: true });
        window.addEventListener('pointermove', function (e) {
            if (mode !== '3d' || e.pointerType !== 'mouse') return;
            mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; kick();
        }, { passive: true });
        [mqReduce, mq3d].forEach(function (q) { (q.addEventListener ? q.addEventListener('change', setMode) : q.addListener(setMode)); });
        setMode();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
