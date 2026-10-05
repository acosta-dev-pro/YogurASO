/* ficha.js — ficha ampliada de cada sabor (ventana sobre la página) + acordeón animado de preguntas.
   Se abre desde las tarjetas del carrusel (data-ficha="slug"). Usa YOGUR_FLAVORS y los datos de js/product-info.js.
   Lo que no está confirmado se muestra con texto general; nunca se inventan cifras. */
(function () {
    'use strict';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var FL = window.YOGUR_FLAVORS || [];
    var I = window.YOG_INFO || {};
    var COLORS = { fresa: '#BC1D29', pina: '#E3A008', mora: '#74205A', melocoton: '#D9570F', 'frutos-rojos': '#A8143A', cafe: '#55281A', guanabana: '#347A22', mango: '#EC7F0A' };
    var ic = function (n) { return window.YogIcon ? window.YogIcon(n) : ''; };
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function pend(isPending) { return (isPending && I.marcarPendientes !== false) ? '<span class="pend" title="Dato pendiente de confirmar por YogurASO">Por confirmar</span>' : ''; }
    window.YogPend = pend;
    function wa(text) {
        var n = (window.YOGUR_CONFIG && window.YOGUR_CONFIG.WHATSAPP_NUMBER) || '';
        return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text);
    }

    function content(f) {
        var d = (I.sabores && I.sabores[f.slug]) || {};
        var ingr = d.ingredientes || I.ingredientesBase;
        var sizes = (I.presentaciones && I.presentaciones.length) ? I.presentaciones : ['500 ml'];
        var base = 'assets/products/yoguraso-' + f.slug + '-500ml';
        var keep = [
            I.temperatura ? 'Refrigerado entre ' + esc(I.temperatura) + '.' : 'Siempre refrigerado, lejos del sol.',
            I.vidaUtilCerradoDias ? 'Cerrado: hasta ' + I.vidaUtilCerradoDias + ' días en la nevera.' : 'Cerrado: hasta la fecha impresa en el envase.',
            I.vidaUtilAbiertoDias ? 'Abierto: consúmelo en máximo ' + I.vidaUtilAbiertoDias + ' días.' : 'Abierto: bien tapado y en pocos días.'
        ];
        return '' +
        '<div class="fc-art">' +
            '<span class="fc-mesh" aria-hidden="true"></span><span class="fc-ring" aria-hidden="true"></span>' +
            '<img class="fc-bottle" src="' + base + '.webp" srcset="' + base + '-sm.webp 320w, ' + base + '.webp 640w" sizes="(max-width: 760px) 40vw, 260px" alt="' + esc(f.alt) + '" width="640" height="1110" decoding="async">' +
            '<span class="fc-floor" aria-hidden="true"></span>' +
        '</div>' +
        '<div class="fc-body">' +
            '<span class="fc-kicker">Yogurt artesanal</span>' +
            '<h2 class="fc-title" id="fc-title">' + esc(f.nombre) + '</h2>' +
            (d.nota ? '<p class="fc-lead">' + esc(d.nota) + '</p>' : '<p class="fc-lead">Cremoso, bien frío y con el sabor de ' + esc(f.nombre.toLowerCase()) + ' que te gusta.</p>') +
            '<div class="fc-chips">' + sizes.map(function (s) { return '<span class="fc-chip">' + ic('glass-water') + esc(s) + '</span>'; }).join('') + '</div>' +
            ((I.sellosEtiqueta && I.sellosEtiqueta.length) ? '<div class="fc-block"><h3>' + ic('tag') + 'En la etiqueta' + pend(!I.sellosConfirmados) + '</h3><ul class="fc-seals">' + I.sellosEtiqueta.map(function (s) { return '<li>' + ic('check') + esc(s) + '</li>'; }).join('') + '</ul></div>' : '') +
            '<div class="fc-block"><h3>' + ic('leaf') + 'Ingredientes' + pend(!(ingr && ingr.length)) + '</h3><p>' + (ingr && ingr.length ? esc(ingr.join(', ')) + '.' : 'Leche fresca y cultivos vivos. El detalle de cada sabor está en su etiqueta.') + '</p></div>' +
            '<div class="fc-block"><h3>' + ic('snowflake') + 'Conservación' + pend(!(I.temperatura && I.vidaUtilCerradoDias && I.vidaUtilAbiertoDias)) + '</h3><ul class="fc-list">' + keep.map(function (k) { return '<li>' + k + '</li>'; }).join('') + '</ul></div>' +
            '<div class="fc-block"><h3>' + ic('utensils-crossed') + 'Ideas para servir</h3><p>Solo y bien frío, con granola, con fruta picada o en un batido.</p></div>' +
            '<div class="fc-actions">' +
                '<a class="fc-btn fc-btn-solid" href="' + wa('Hola YogurASO, quiero pedir yogurt de ' + f.nombre) + '" target="_blank" rel="noopener">' + ic('message-circle') + 'Pedir por WhatsApp</a>' +
                '<a class="fc-btn fc-btn-ghost" href="pages/productos.html">Ver catálogo ' + ic('arrow-right') + '</a>' +
            '</div>' +
        '</div>';
    }

    var dlg, idx = 0, opener = null;
    function build() {
        dlg = document.createElement('dialog');
        dlg.className = 'fc';
        dlg.setAttribute('aria-labelledby', 'fc-title');
        dlg.innerHTML = '<div class="fc-card" id="fc-card"></div>' +
            '<button type="button" class="fc-close" aria-label="Cerrar ficha">' + ic('x') + '</button>' +
            '<div class="fc-nav"><button type="button" class="fc-arrow" data-dir="-1" aria-label="Sabor anterior">' + ic('chevron-left') + '</button>' +
            '<span class="fc-count" aria-live="polite"></span>' +
            '<button type="button" class="fc-arrow" data-dir="1" aria-label="Sabor siguiente">' + ic('chevron-right') + '</button></div>';
        document.body.appendChild(dlg);
        dlg.addEventListener('click', function (e) {
            if (e.target === dlg) return close();
            if (e.target.closest('.fc-close')) return close();
            var a = e.target.closest('.fc-arrow');
            if (a) go(idx + Number(a.dataset.dir), Number(a.dataset.dir));
        });
        dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
        dlg.addEventListener('keydown', function (e) {
            if (e.target.closest('a, input, textarea')) return;
            if (e.key === 'ArrowRight') go(idx + 1, 1);
            if (e.key === 'ArrowLeft') go(idx - 1, -1);
        });
        // Deslizar en táctil
        var x0 = null;
        dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
        dlg.addEventListener('touchend', function (e) {
            if (x0 == null) return;
            var dx = e.changedTouches[0].clientX - x0; x0 = null;
            if (Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        });
    }
    function render(dir) {
        var f = FL[idx], card = dlg.querySelector('#fc-card');
        dlg.style.setProperty('--c', COLORS[f.slug] || f.dot);
        dlg.querySelector('.fc-count').textContent = (idx + 1) + ' / ' + FL.length;
        var paint = function () {
            card.innerHTML = content(f);
            card.classList.remove('is-leaving', 'from-l', 'from-r');
            if (dir && !reduce.matches) { void card.offsetWidth; card.classList.add(dir > 0 ? 'from-r' : 'from-l'); }
        };
        if (dir && !reduce.matches) { card.classList.add('is-leaving'); setTimeout(paint, 160); } else paint();
    }
    function go(n, dir) { idx = (n + FL.length) % FL.length; render(dir); }
    function open(slug, from) {
        if (!FL.length) return;
        if (!dlg) build();
        opener = from || document.activeElement;
        idx = Math.max(0, FL.findIndex(function (f) { return f.slug === slug; }));
        render(0);
        dlg.showModal();
        document.documentElement.classList.add('fc-lock');
        requestAnimationFrame(function () { dlg.classList.add('is-open'); });
        dlg.querySelector('.fc-close').focus();
    }
    function close() {
        if (!dlg || !dlg.open) return;
        dlg.classList.remove('is-open');
        document.documentElement.classList.remove('fc-lock');
        setTimeout(function () { dlg.close(); if (opener && opener.focus) opener.focus({ preventScroll: true }); }, reduce.matches ? 0 : 260);
    }
    window.YogFicha = { open: open, close: close };

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
