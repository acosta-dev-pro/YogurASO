/* Menú de celular: abre/cierra las opciones del header. */
(function () {
    var btn = document.getElementById('navToggle');
    var list = document.getElementById('nav-items');
    if (!btn || !list) return;

    function setOpen(open) {
        list.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    }

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        setOpen(!list.classList.contains('is-open'));
    });

    document.addEventListener('click', function (e) {
        if (!list.classList.contains('is-open')) return;
        if (btn.contains(e.target) || list.contains(e.target)) return;
        setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setOpen(false);
    });
})();
