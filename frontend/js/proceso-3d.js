/* Proceso 3D — órbita de pasos alrededor de la botella + parallax.
   Solo anima transform/opacity. Respeta prefers-reduced-motion. */
(function () {
    'use strict';
    var root = document.querySelector('[data-p3d]');
    if (!root) return;
    var stage = root.querySelector('[data-p3d-stage]');
    var scene = root.querySelector('[data-p3d-scene]');
    var steps = Array.prototype.slice.call(root.querySelectorAll('.p3d__step'));
    var fruits = Array.prototype.slice.call(root.querySelectorAll('.p3d__fruit'));
    var layers = Array.prototype.slice.call(root.querySelectorAll('[data-p3d-layer]'));
    if (!stage || !scene || steps.length === 0) return;

    var mqDesk = window.matchMedia('(min-width: 768px)');
    var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var mqHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    var N = steps.length, STEP = 360 / N;
    var geo = { cx: 0, cy: 0, rx: 0, ry: 0 };
    var rot = 0, rotTarget = 0, active = 0, hoverIdx = -1;
    var tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    var inView = false, raf = 0, enabled = false;

    function measure() {
        var w = stage.clientWidth, h = stage.clientHeight || 860;
        geo.cx = w * (w > 1100 ? 0.56 : 0.5);
        geo.rx = Math.min(w * (w > 1100 ? 0.30 : 0.26), 450);
        geo.ry = Math.min(geo.rx * 0.34, 150);
        geo.cy = h - geo.ry - 150;
        stage.style.setProperty('--cx', geo.cx + 'px');
        stage.style.setProperty('--cy', geo.cy + 'px');
        stage.style.setProperty('--rx', geo.rx + 'px');
        stage.style.setProperty('--ry', geo.ry + 'px');
    }
    // índice activo -> ángulo objetivo (el activo queda al frente, abajo a la izquierda)
    function targetFor(i) { return 120 - i * STEP; }

    function place() {
        for (var i = 0; i < N; i++) {
            var a = (rot + i * STEP) * Math.PI / 180;
            var c = Math.cos(a), s = Math.sin(a); // s=1 frente, s=-1 fondo
            var depth = (s + 1) / 2;
            var x = geo.cx + c * geo.rx, y = geo.cy + s * geo.ry;
            var el = steps[i];
            var left = c < 0;
            var back = s < -0.05;
            if (el._l !== left) { el.classList.toggle('is-left', left); el._l = left; }
            if (el._b !== back) { el.classList.toggle('is-back', back); el._b = back; }
            var sc = 0.84 + depth * 0.16;
            var ox = left ? (el.offsetWidth - 22) : 22;
            el.style.transform = 'translate3d(' + (x - ox).toFixed(1) + 'px,' + (y - 22).toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
            el.style.opacity = (0.5 + depth * 0.5).toFixed(3);
            el.style.zIndex = s > 0.05 ? 7 : 3;
        }
    }
    function setActive(i) {
        if (i === active && rotTarget === targetFor(i)) return;
        active = i;
        // camino más corto
        var t = targetFor(i), d = ((t - rot) % 360 + 540) % 360 - 180;
        rotTarget = rot + d;
        for (var k = 0; k < N; k++) steps[k].classList.toggle('is-active', k === i);
        kick();
    }
    function applyTilt() {
        if (mqReduce.matches) return;
        scene.style.transform = 'rotateX(' + (tilt.y * -3).toFixed(2) + 'deg) rotateY(' + (tilt.x * 4).toFixed(2) + 'deg)';
        for (var i = 0; i < layers.length; i++) {
            var d = parseFloat(layers[i].getAttribute('data-p3d-layer')) || 0;
            var tx = (tilt.x * d * 26).toFixed(1), ty = (tilt.y * d * 18).toFixed(1);
            var el = layers[i].classList.contains('p3d__fruit') ? layers[i].firstElementChild : layers[i];
            if (el.classList.contains('p3d__bottle')) el.style.transform = 'translateX(-50%) translate3d(' + tx + 'px,' + ty + 'px,0)';
            else el.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
        }
    }
    function frame() {
        raf = 0;
        var k = mqReduce.matches ? 1 : 0.085;
        rot += (rotTarget - rot) * k;
        tilt.x += (tilt.tx - tilt.x) * 0.08;
        tilt.y += (tilt.ty - tilt.y) * 0.08;
        place();
        applyTilt();
        var moving = Math.abs(rotTarget - rot) > 0.05 || Math.abs(tilt.tx - tilt.x) > 0.002 || Math.abs(tilt.ty - tilt.y) > 0.002;
        if (moving && enabled) raf = requestAnimationFrame(frame);
        else if (!moving) { rot = rotTarget; place(); }
    }
    function kick() { if (!raf && enabled) raf = requestAnimationFrame(frame); }

    function onScroll() {
        if (!enabled || !inView || hoverIdx >= 0) return;
        var r = root.getBoundingClientRect(), vh = window.innerHeight;
        var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
        p = Math.max(0, Math.min(0.999, p));
        setActive(Math.floor(p * N));
    }
    function onMove(e) {
        if (!enabled || mqReduce.matches) return;
        var r = root.getBoundingClientRect();
        tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tilt.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
    }
    function onLeave() { tilt.tx = 0; tilt.ty = 0; hoverIdx = -1; kick(); onScroll(); }

    function clearInline() {
        steps.forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; el.style.zIndex = ''; el.classList.remove('is-left', 'is-back', 'is-active'); el._l = el._b = undefined; });
        layers.forEach(function (l) { var el = l.classList.contains('p3d__fruit') ? l.firstElementChild : l; if (el) el.style.transform = ''; });
        scene.style.transform = '';
    }
    function update() {
        var want = mqDesk.matches;
        if (want === enabled) { if (enabled) { measure(); place(); } return; }
        enabled = want;
        root.classList.toggle('is-3d', enabled);
        if (enabled) {
            measure();
            rot = rotTarget = targetFor(active);
            for (var k = 0; k < N; k++) steps[k].classList.toggle('is-active', k === active);
            place();
            onScroll();
        } else {
            if (raf) cancelAnimationFrame(raf); raf = 0;
            clearInline();
        }
    }

    steps.forEach(function (el, i) {
        el.addEventListener('mouseenter', function () { if (!enabled || !mqHover.matches) return; hoverIdx = i; setActive(i); });
        el.addEventListener('mouseleave', function () { if (hoverIdx === i) hoverIdx = -1; });
    });
    if (mqHover.matches) {
        root.addEventListener('mousemove', onMove, { passive: true });
        root.addEventListener('mouseleave', onLeave);
    }
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) onScroll(); }, { threshold: 0 }).observe(root);
    } else { inView = true; }
    window.addEventListener('scroll', onScroll, { passive: true });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(update, 120); });
    if (mqDesk.addEventListener) mqDesk.addEventListener('change', update);
    update();
})();
