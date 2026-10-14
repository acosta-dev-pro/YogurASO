/* cart-fx.js — Aquí quedan los efectos del carrito: el número que late, la botella que vuela al ícono y el aviso de quitar.
   No guarda productos. Lo carga cart.js. Si la persona pidió menos movimiento, no anima. */
(function () {
    'use strict';
    if (window.CartFx) return;

    function reduced() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function pageZoom() {
        var z = parseFloat(getComputedStyle(document.documentElement).zoom);
        return z > 0 && isFinite(z) ? z : 1;
    }
    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // Último punto de interacción: de ahí sale la botella que vuela.
    var last = null;
    function remember(e) {
        last = { el: e.target, t: Date.now(), x: e.clientX || 0, y: e.clientY || 0 };
    }
    document.addEventListener('pointerdown', remember, true);
    document.addEventListener('click', remember, true);

    /* ---------- 1) Latido del contador ---------- */
    function restart(el, cls) {
        if (!el) return;
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
    }
    function pulse() {
        restart(document.getElementById('cart-count'), 'cfx-pulse');
        restart(document.getElementById('cartBtn'), 'cfx-pulse');
    }

    /* ---------- 2) Vuelo al carrito ---------- */
    function visibleImg(img) {
        if (!img) return false;
        var r = img.getBoundingClientRect();
        return r.width > 12 && r.height > 12 && r.bottom > 0 && r.top < window.innerHeight;
    }
    function sourceImage(el) {
        if (!el || !el.closest) return null;
        var scope = el.closest('[role="dialog"], dialog, .producto-card, [data-hp-card], [data-id], article, li');
        var guard = 0;
        while (scope && guard++ < 4) {
            var imgs = scope.querySelectorAll('img');
            var best = null, area = 0;
            for (var i = 0; i < imgs.length; i++) {
                if (!visibleImg(imgs[i])) continue;
                var r = imgs[i].getBoundingClientRect();
                var a = r.width * r.height;
                if (a > area) { area = a; best = imgs[i]; }
            }
            if (best) return best;
            scope = scope.parentElement && scope.parentElement.closest('[role="dialog"], dialog, section, main');
        }
        return null;
    }
    function assetUrl(p) {
        var u = String((p && (p.imagen_url || p.imagen)) || '');
        if (!u) return '';
        if (/^(https?:|data:|\/)/.test(u) || u.indexOf('../') === 0) return u;
        return (location.pathname.indexOf('/pages/') !== -1 ? '../' : '') + u.replace(/^\.\//, '');
    }

    function fly(producto) {
        var target = document.getElementById('cartBtn');
        if (!target || reduced()) { pulse(); return; }
        var fresh = last && (Date.now() - last.t) < 2000;
        var img = fresh ? sourceImage(last.el) : null;
        var from, url;
        if (img) {
            from = img.getBoundingClientRect();
            url = img.currentSrc || img.src;
        } else if (fresh && assetUrl(producto)) {
            url = assetUrl(producto);
            from = { left: last.x - 28, top: last.y - 48, width: 56, height: 96 };
        } else {
            pulse();
            return;
        }
        var to = target.getBoundingClientRect();
        if (!from.width || !to.width) { pulse(); return; }

        // Caja del viajero: proporción de botella, alto máximo 220px visual.
        var h = Math.min(from.height, 220);
        var w = Math.min(from.width, h * 0.62);
        var x0 = from.left + from.width / 2, y0 = from.top + from.height / 2;
        var x2 = to.left + to.width / 2, y2 = to.top + to.height / 2;
        var x1 = x0 + (x2 - x0) * 0.35;
        var y1 = Math.max(to.bottom + 8, Math.min(y0, y2) - Math.max(80, Math.abs(x2 - x0) * 0.18));
        var endScale = Math.max(0.06, (to.height * 0.8) / h);

        var z = pageZoom();
        var node = document.createElement('div');
        node.className = 'cfx-fly';
        node.setAttribute('aria-hidden', 'true');
        node.style.width = (w / z).toFixed(1) + 'px';
        node.style.height = (h / z).toFixed(1) + 'px';
        node.style.left = ((x0 - w / 2) / z).toFixed(1) + 'px';
        node.style.top = ((y0 - h / 2) / z).toFixed(1) + 'px';
        var im = document.createElement('img');
        im.alt = '';
        im.decoding = 'sync';
        im.src = url;
        node.appendChild(im);

        var frames = [];
        var N = 24;
        for (var i = 0; i <= N; i++) {
            var t = i / N, u = 1 - t;
            var bx = u * u * x0 + 2 * u * t * x1 + t * t * x2;
            var by = u * u * y0 + 2 * u * t * y1 + t * t * y2;
            var s = 1 + (endScale - 1) * (t * t);
            frames.push({
                offset: t,
                transform: 'translate3d(' + ((bx - x0) / z).toFixed(2) + 'px,' + ((by - y0) / z).toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')',
                opacity: t < 0.82 ? 1 : Math.max(0, 1 - (t - 0.82) / 0.18)
            });
        }

        function launch() {
            document.body.appendChild(node);
            var anim = node.animate ? node.animate(frames, { duration: 720, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', fill: 'forwards' }) : null;
            var done = function () { if (node.parentNode) node.parentNode.removeChild(node); pulse(); };
            if (anim) { anim.onfinish = done; anim.oncancel = done; } else done();
        }
        // Sin parpadeo: arranca cuando la imagen ya está decodificada (viene de caché).
        if (im.decode) im.decode().then(launch, launch); else launch();
    }

    /* ---------- 3) Confirmación ---------- */
    var open = null;
    function confirmDialog(opts) {
        opts = opts || {};
        if (open) open(false);
        return new Promise(function (resolve) {
            var prevFocus = document.activeElement;
            var wrap = document.createElement('div');
            wrap.className = 'cfx-confirm-wrap';
            wrap.innerHTML =
                '<div class="cfx-confirm" role="alertdialog" aria-modal="true" aria-labelledby="cfx-confirm-title" aria-describedby="cfx-confirm-name">' +
                (opts.name ? '<p class="cfx-confirm-name" id="cfx-confirm-name">' + esc(opts.name) + '</p>' : '') +
                '<h2 class="cfx-confirm-title" id="cfx-confirm-title">' + esc(opts.title || '¿Quitar del carrito?') + '</h2>' +
                '<div class="cfx-confirm-actions">' +
                '<button type="button" class="cfx-confirm-cancel">' + esc(opts.cancelText || 'Cancelar') + '</button>' +
                '<button type="button" class="cfx-confirm-ok">' + esc(opts.confirmText || 'Quitar') + '</button>' +
                '</div></div>';
            var okBtn = wrap.querySelector('.cfx-confirm-ok');
            var noBtn = wrap.querySelector('.cfx-confirm-cancel');
            function close(val) {
                open = null;
                document.removeEventListener('keydown', onKey, true);
                wrap.classList.remove('is-in');
                var remove = function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); };
                if (reduced()) remove(); else setTimeout(remove, 160);
                if (prevFocus && prevFocus.focus && document.contains(prevFocus)) {
                    try { prevFocus.focus({ preventScroll: true }); } catch (e) { /* nada */ }
                }
                resolve(!!val);
            }
            function onKey(e) {
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); return; }
                if (e.key === 'Tab') {
                    e.preventDefault();
                    (document.activeElement === okBtn ? noBtn : okBtn).focus();
                }
            }
            open = close;
            // Los clics dentro no deben cerrar el carrito de fondo.
            wrap.addEventListener('click', function (e) {
                e.stopPropagation();
                if (e.target === wrap) close(false);
            });
            wrap.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
            okBtn.addEventListener('click', function () { close(true); });
            noBtn.addEventListener('click', function () { close(false); });
            document.addEventListener('keydown', onKey, true);
            document.body.appendChild(wrap);
            void wrap.offsetWidth;
            wrap.classList.add('is-in');
            okBtn.focus({ preventScroll: true });
        });
    }

    window.CartFx = { pulse: pulse, fly: fly, confirm: confirmDialog };
})();
