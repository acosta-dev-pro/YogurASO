/* Menú de celular: abre/cierra las opciones del header.
   Esc cierra y devuelve el foco al botón; el foco no sale del menú mientras está abierto.
   También enfoca el buscador del catálogo cuando se llega con #buscar (lupa del header). */
(function () {
    var btn = document.getElementById('navToggle');
    var list = document.getElementById('nav-items');
    var header = document.getElementById('siteHeader');

    // Barra roja al bajar (arriba de todo es transparente sobre la portada).
    if (header) {
        var marcar = function () { header.classList.toggle('is-stuck', window.scrollY > 0); };
        window.addEventListener('scroll', marcar, { passive: true });
        marcar();
    }

    if (btn && list) {
        var setOpen = function (open, restoreFocus, viaKeyboard) {
            list.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
            list.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (open && viaKeyboard) {
                var first = list.querySelector('a');
                if (first) first.focus({ preventScroll: true });
            } else if (!open && restoreFocus && viaKeyboard) {
                btn.focus({ preventScroll: true });
            }
        };

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var viaKeyboard = e.detail === 0;
            setOpen(!list.classList.contains('is-open'), true, viaKeyboard);
        });

        document.addEventListener('click', function (e) {
            if (!list.classList.contains('is-open')) return;
            if (btn.contains(e.target) || list.contains(e.target)) return;
            setOpen(false, false);
        });

        // Un toque en un enlace del menú lo cierra (los anclas no recargan la página)
        list.addEventListener('click', function (e) {
            if (e.target.closest('a')) setOpen(false, false);
        });

        document.addEventListener('keydown', function (e) {
            if (!list.classList.contains('is-open')) return;
            if (e.key === 'Escape') { setOpen(false, true); return; }
            if (e.key !== 'Tab') return;
            var items = [btn].concat(Array.prototype.slice.call(list.querySelectorAll('a')));
            var i = items.indexOf(document.activeElement);
            if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
            else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
        });
    }

    if (location.hash === '#buscar') {
        window.addEventListener('load', function () {
            var q = document.getElementById('catalog-search');
            if (q) q.focus();
        });
    }

    // Logo Badge / Tira de jalar hacia arriba (Scroll elástico fluido al inicio)
    var logoBtn = document.getElementById('brandLogoBtn') || document.querySelector('.brand-logo');
    if (logoBtn) {
        logoBtn.addEventListener('click', function (e) {
            var startY = window.pageYOffset || document.documentElement.scrollTop;
            var isHome = location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/');

            // Si está en scroll hacia abajo, jala la pantalla rápidamente hacia arriba
            if (startY > 50) {
                e.preventDefault();

                // Animación rápida y directa (280ms)
                var duration = Math.min(320, Math.max(200, Math.sqrt(startY) * 7.5));
                var startTime = null;

                function easeFast(t) {
                    return 1 - Math.pow(1 - t, 3.5);
                }

                function animateScroll(currentTime) {
                    if (!startTime) startTime = currentTime;
                    var elapsed = currentTime - startTime;
                    var progress = Math.min(elapsed / duration, 1);
                    var ease = easeFast(progress);

                    window.scrollTo(0, startY * (1 - ease));

                    if (progress < 1) {
                        window.requestAnimationFrame(animateScroll);
                    } else {
                        window.scrollTo(0, 0);
                        if (window.history && window.history.replaceState) {
                            window.history.replaceState(null, '', location.pathname);
                        }
                    }
                }

                window.requestAnimationFrame(animateScroll);
            } else if (isHome && startY <= 50) {
                e.preventDefault();
                window.scrollTo(0, 0);
            }
            // Si está en otra página y ya está en top (startY <= 50), navega normalmente a index.html
        });
    }
})();
