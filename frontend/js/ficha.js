/* ficha.js — etiqueta "Por confirmar" (YogPend) + acordeón animado de preguntas con datos de js/product-info.js.
   La ficha flotante de cada sabor está en js/ficha-modal.js (window.YogFicha).
   Lo que no está confirmado se muestra con texto general; nunca se inventan cifras. */
(function () {
    'use strict';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var I = window.YOG_INFO || {};
    function pend(isPending) { return (isPending && I.marcarPendientes !== false) ? '<span class="pend" title="Dato pendiente de confirmar por YogurASO">Por confirmar</span>' : ''; }
    window.YogPend = pend;
    // La ficha flotante de cada sabor vive en js/ficha-modal.js (window.YogFicha).

    /* ---------- Preguntas frecuentes: datos reales + apertura suave ---------- */
    function faq() {
        var life = document.getElementById('fq-life'), keep = document.getElementById('fq-keep'), ingr = document.getElementById('fq-ingr');
        if (life && (I.vidaUtilCerradoDias || I.vidaUtilAbiertoDias)) {
            life.textContent = (I.vidaUtilCerradoDias ? 'Cerrado y en la nevera, hasta ' + I.vidaUtilCerradoDias + ' días (revisa la fecha impresa). ' : 'Cerrado, hasta la fecha impresa en el envase. ') +
                (I.vidaUtilAbiertoDias ? 'Una vez abierto, consúmelo en máximo ' + I.vidaUtilAbiertoDias + ' días.' : 'Una vez abierto, disfrútalo en pocos días.');
        }
        if (keep && I.temperatura) keep.textContent = 'Siempre refrigerado entre ' + I.temperatura + ', bien tapado y lejos del sol. Sírvelo con vaso o cuchara limpios.';
        if (ingr && I.ingredientesBase && I.ingredientesBase.length) ingr.textContent = 'Ingredientes base: ' + I.ingredientesBase.join(', ') + '. Cada etiqueta trae el detalle de su sabor. Si tienes una alergia, escríbenos antes de pedir.';

        [[life, !(I.vidaUtilCerradoDias && I.vidaUtilAbiertoDias)], [keep, !I.temperatura], [ingr, !(I.ingredientesBase && I.ingredientesBase.length)]].forEach(function (x) {
            if (x[0] && x[1] && I.marcarPendientes !== false) x[0].insertAdjacentHTML('beforeend', ' ' + pend(true));
        });
        var items = Array.prototype.slice.call(document.querySelectorAll('.fq-item'));
        function shut(d) {
            var body = d.querySelector('.fq-a');
            if (!d.open) return;
            d.classList.remove('is-open');
            if (reduce.matches || !body.animate) { d.open = false; return; }
            d.dataset.anim = '1';
            body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
                .onfinish = function () { d.open = false; delete d.dataset.anim; };
        }
        items.forEach(function (d) {
            d.addEventListener('toggle', function () { if (d.open) { d.classList.add('is-open'); items.forEach(function (o) { if (o !== d) shut(o); }); } else d.classList.remove('is-open'); });
        });
        items.forEach(function (d) {
            var sum = d.querySelector('summary'), body = d.querySelector('.fq-a');
            sum.addEventListener('click', function (e) {
                if (reduce.matches || !body.animate) return;
                e.preventDefault();
                if (d.dataset.anim) return;
                d.dataset.anim = '1';
                if (d.open) { delete d.dataset.anim; shut(d); }
                else {
                    d.open = true; d.classList.add('is-open');
                    var h2 = body.offsetHeight;
                    body.animate([{ height: '0px', opacity: 0 }, { height: h2 + 'px', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
                        .onfinish = function () { delete d.dataset.anim; };
                }
            });
            if (d.open) d.classList.add('is-open');
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', faq); else faq();
})();
