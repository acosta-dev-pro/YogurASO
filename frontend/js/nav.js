/* Menú de celular: abre/cierra las opciones del header.
   Esc cierra y devuelve el foco al botón; el foco no sale del menú mientras está abierto.
   También enfoca el buscador del catálogo cuando se llega con #buscar (lupa del header). */
(function () {
    var btn = document.getElementById('navToggle');
    var list = document.getElementById('nav-items');

    if (btn && list) {
        var setOpen = function (open, restoreFocus) {
            list.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
            if (open) {
                var first = list.querySelector('a');
                if (first) first.focus();
            } else if (restoreFocus) {
                btn.focus();
            }
        };

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            setOpen(!list.classList.contains('is-open'), true);
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
})();
