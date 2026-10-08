/* Proceso 3D — órbita automática de pasos alrededor de la botella + parallax.
   Rota sola (≈16 s por vuelta), se pausa al pasar el puntero sobre un paso y fuera de pantalla.
   Solo anima transform/opacity. prefers-reduced-motion: órbita estática con 01 a la izquierda. */
(function () {
    'use strict';
    var root = document.querySelector('[data-p3d]');
    if (!root) return;
    var stage = root.querySelector('[data-p3d-stage]');
    var scene = root.querySelector('[data-p3d-scene]');
    var steps = Array.prototype.slice.call(root.querySelectorAll('.p3d__step'));
    var layers = Array.prototype.slice.call(root.querySelectorAll('[data-p3d-layer]'));
    if (!stage || !scene || steps.length === 0) return;

    var mqDesk = window.matchMedia('(min-width: 768px)');
    var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var mqHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    var N = steps.length, STEP = 360 / N;
    var TURN_MS = 16000, SPEED = -360 / TURN_MS; // grados/ms (negativo: cada paso pasa al frente en orden 01, 02, 03…)
    var HALF = 15; // mitad del punto numerado (se mide en measure)
    var PAD = 8;   // relleno de la tarjeta del paso hasta el punto
    var BY = 0.6;  // la órbita cruza la botella al 60% de su alto: los pasos la rodean
    var geo = { cx: 0, cy: 0, rx: 0, ry: 0 };
    var rot = 180, vel = 0, hoverIdx = -1, active = -1;
    var tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    var inView = false, raf = 0, enabled = false, last = 0;

    function measure() {
        var w = stage.clientWidth, h = stage.clientHeight || 560;
        var sr = stage.getBoundingClientRect();
        var head = root.querySelector('.p3d__head');
        var hr = head ? head.getBoundingClientRect() : null;
        var wide = w >= 1100;
        var stepW = steps[0].offsetWidth || 168;
        var dot = steps[0].querySelector('.p3d__dot');
        HALF = dot && dot.offsetWidth ? dot.offsetWidth / 2 : 15;
        PAD = dot ? (parseFloat(getComputedStyle(steps[0]).paddingTop) || 0) : 8;
        var stepH = steps[0].offsetHeight || 64;
        var bottle = root.querySelector('.p3d__bottle');
        var bh = bottle ? bottle.offsetHeight : 260;
        var L, R, top;
        if (wide && hr) {
            // cabecera a la izquierda: la órbita ocupa el espacio restante a la derecha
            L = hr.right - sr.left + 24; R = Math.min(w, sr.width) - 24; top = 0;
        } else {
            L = 20; R = w - 20; top = hr ? (hr.bottom - sr.top + 8) : 0;
        }
        geo.cx = (L + R) / 2;
        geo.rx = Math.max(170, Math.min((R - L) / 2 - stepW * 0.75, 300));
        geo.ry = Math.min(geo.rx * 0.26, 74);
        // centra verticalmente: desde la tapa de la botella hasta la tarjeta del paso frontal
        var below = Math.max(bh * (1 - BY) + 8, geo.ry + stepH - PAD - HALF);
        var content = bh * BY + below;
        var bt = top + Math.max(8, (h - top - content) / 2);
        geo.cy = bt + bh * BY;
        stage.style.setProperty('--bt', bt.toFixed(1) + 'px');
        stage.style.setProperty('--gy', (bt + bh * 0.91).toFixed(1) + 'px');
        stage.style.setProperty('--cx', geo.cx.toFixed(1) + 'px');
        stage.style.setProperty('--cy', geo.cy.toFixed(1) + 'px');
        stage.style.setProperty('--rx', geo.rx.toFixed(1) + 'px');
        stage.style.setProperty('--ry', geo.ry.toFixed(1) + 'px');
    }

    function place() {
        var best = -2, bestI = 0;
        for (var i = 0; i < N; i++) {
            // paso i en ángulo rot + i*STEP: con rot=180, 01 queda a la izquierda y 02, 03… siguen en sentido horario
            var a = (rot + i * STEP) * Math.PI / 180;
            var c = Math.cos(a), s = Math.sin(a); // s=1 frente, s=-1 fondo
            var depth = (s + 1) / 2;
            var x = geo.cx + c * geo.rx, y = geo.cy + s * geo.ry;
            var el = steps[i];
            var left = c < 0;
            var back = s < -0.05;
            if (el._l !== left) { el.classList.toggle('is-left', left); el._l = left; }
            if (el._b !== back) { el.classList.toggle('is-back', back); el._b = back; }
            var sc = 0.8 + depth * 0.2;
            var ox = left ? (el.offsetWidth - PAD - HALF) : (PAD + HALF);
            el.style.transform = 'translate3d(' + (x - ox).toFixed(1) + 'px,' + (y - PAD - HALF).toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
            el.style.opacity = (0.4 + depth * 0.6).toFixed(3);
            // delante de la botella (z 4) en la mitad frontal, detrás en la trasera
            el.style.zIndex = s > 0 ? 7 + Math.round(s * 4) : 3;
            if (s > best) { best = s; bestI = i; }
        }
        var act = hoverIdx >= 0 ? hoverIdx : bestI;
        if (act !== active) {
            active = act;
            for (var k = 0; k < N; k++) steps[k].classList.toggle('is-active', k === act);
        }
    }
    function applyTilt() {
        scene.style.transform = 'rotateX(' + (tilt.y * -3).toFixed(2) + 'deg) rotateY(' + (tilt.x * 4).toFixed(2) + 'deg)';
        for (var i = 0; i < layers.length; i++) {
            var d = parseFloat(layers[i].getAttribute('data-p3d-layer')) || 0;
            var tx = (tilt.x * d * 22).toFixed(1), ty = (tilt.y * d * 15).toFixed(1);
            var el = layers[i].classList.contains('p3d__fruit') ? layers[i].firstElementChild : layers[i];
            if (el.classList.contains('p3d__bottle')) el.style.transform = 'translateX(-50%) translate3d(' + tx + 'px,' + ty + 'px,0)';
            else el.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
        }
    }
    function running() { return enabled && inView && !mqReduce.matches && !document.hidden; }
    function frame(now) {
        raf = 0;
        var dt = last ? Math.min(now - last, 64) : 16;
        last = now;
        // velocidad con suavizado: se detiene y arranca sin saltos
        var target = hoverIdx >= 0 ? 0 : SPEED;
        vel += (target - vel) * Math.min(1, dt / 220);
        rot = (rot + vel * dt) % 360;
        tilt.x += (tilt.tx - tilt.x) * 0.08;
        tilt.y += (tilt.ty - tilt.y) * 0.08;
        place();
        applyTilt();
        if (running()) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && running()) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    function onMove(e) {
        if (!enabled || mqReduce.matches) return;
        var r = root.getBoundingClientRect();
        tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tilt.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    function onLeave() { tilt.tx = 0; tilt.ty = 0; hoverIdx = -1; }

    function clearInline() {
        steps.forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; el.style.zIndex = ''; el.classList.remove('is-left', 'is-back', 'is-active'); el._l = el._b = undefined; });
        layers.forEach(function (l) { var el = l.classList.contains('p3d__fruit') ? l.firstElementChild : l; if (el) el.style.transform = ''; });
        scene.style.transform = '';
        active = -1;
    }
    function update() {
        var want = mqDesk.matches;
        if (want === enabled) { if (enabled) { measure(); place(); start(); } return; }
        enabled = want;
        root.classList.toggle('is-3d', enabled);
        if (enabled) {
            measure();
            if (mqReduce.matches) rot = 180; // estático, reparto uniforme con 01 a la izquierda
            vel = mqReduce.matches ? 0 : SPEED;
            place();
            start();
        } else {
            stop();
            clearInline();
        }
    }

    steps.forEach(function (el, i) {
        el.addEventListener('mouseenter', function () { if (!enabled || !mqHover.matches) return; hoverIdx = i; });
        el.addEventListener('mouseleave', function () { if (hoverIdx === i) hoverIdx = -1; });
    });
    if (mqHover.matches) {
        root.addEventListener('mousemove', onMove, { passive: true });
        root.addEventListener('mouseleave', onLeave);
    }
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
            inView = en[en.length - 1].isIntersecting;
            if (inView) start(); else stop();
        }, { threshold: 0 }).observe(root);
    } else { inView = true; }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(update, 120); });
    if (mqDesk.addEventListener) mqDesk.addEventListener('change', update);
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', function () { if (mqReduce.matches) { stop(); rot = 180; vel = 0; if (enabled) place(); } else start(); });
    update();
})();
