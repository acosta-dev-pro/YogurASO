/* sections.js — secciones nuevas del inicio.
   - Íconos: <i data-ic="nombre"> → SVG Lucide (js/sections-icons.js).
   - Revelado escalonado [data-rv] al entrar en pantalla.
   - Carrusel de sabores: tarjetas desde YOGUR_FLAVORS, arrastre, flechas, barra de progreso e inclinación 3D.
   No toca el hero ni el header. */
(function () {
    'use strict';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    var ICONS = window.YOG_ICONS || {};

    function icon(name, cls) {
        var p = ICONS[name];
        if (!p) return '';
        return '<svg class="' + (cls || 'sx-ic') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
    }
    function paintIcons(root) {
        (root || document).querySelectorAll('i[data-ic]:not([data-ic-done])').forEach(function (el) {
            el.innerHTML = icon(el.getAttribute('data-ic'));
            el.setAttribute('aria-hidden', 'true');
            el.setAttribute('data-ic-done', '');
        });
    }
    window.YogIcon = icon;

    /* Revelado */
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;
    function watchReveal(root) {
        (root || document).querySelectorAll('.sx [data-rv]:not(.is-in), #nosotros [data-rv]:not(.is-in), .productos-catalogo [data-rv]:not(.is-in)').forEach(function (el) {
            if (!io || reduce.matches) el.classList.add('is-in'); else io.observe(el);
        });
    }
    window.YogReveal = watchReveal;

    /* ---------- Carrusel de sabores ---------- */
    var COLORS = { fresa: '#BC1D29', pina: '#E3A008', mora: '#74205A', melocoton: '#D9570F', 'frutos-rojos': '#A8143A', cafe: '#55281A', guanabana: '#347A22', mango: '#EC7F0A' };
    var INFO = window.YOG_INFO || {};
    var size = (INFO.presentaciones && INFO.presentaciones[0]) || '500 ml';

    function buildRail() {
        var track = document.getElementById('sx-track');
        var flavors = window.YOGUR_FLAVORS || [];
        if (!track || !flavors.length) return;
        track.innerHTML = flavors.map(function (f, i) {
            var base = 'assets/products/yoguraso-' + f.slug + '-500ml';
            return '<li class="fl-card" data-rv style="--i:' + Math.min(i, 5) + '">' +
                '<a class="fl-card-hit" href="pages/productos.html" data-ficha="' + f.slug + '" style="--c:' + (COLORS[f.slug] || f.dot) + '" aria-label="Ver ficha de ' + f.nombre + '">' +
                    '<span class="fl-mesh" aria-hidden="true"></span><span class="fl-ring" aria-hidden="true"></span>' +
                    '<span class="fl-num" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' +
                    '<span class="fl-chip">' + size + '</span>' +
                    '<span class="fl-bottle"><img src="' + base + '-sm.webp" srcset="' + base + '-sm.webp 320w, ' + base + '.webp 640w" sizes="150px" alt="' + f.alt + '" width="320" height="555" loading="lazy" decoding="async" draggable="false"><span class="fl-shadow" aria-hidden="true"></span></span>' +
                    '<span class="fl-meta"><span class="fl-name">' + f.nombre + '</span><span class="fl-sub">Yogurt artesanal</span>' +
                    '<span class="fl-go">Ver ficha ' + icon('arrow-right') + '</span></span>' +
                '</a></li>';
        }).join('');
        track.addEventListener('click', function (e) {
            var a = e.target.closest('[data-ficha]');
            if (!a || !window.YogFicha) return;
            e.preventDefault();
            window.YogFicha.open(a.getAttribute('data-ficha'), a);
        });
        initRail();
        if (fine.matches && !reduce.matches) initTilt(track);
    }

    function initRail() {
        var rail = document.getElementById('sx-rail');
        var prev = document.getElementById('sx-prev');
        var next = document.getElementById('sx-next');
        var bar = document.getElementById('sx-progress');
        if (!rail) return;
        function step() { var c = rail.querySelector('.fl-card'); return c ? c.getBoundingClientRect().width + 20 : 260; }
        function update() {
            var max = rail.scrollWidth - rail.clientWidth;
            var ratio = rail.clientWidth / rail.scrollWidth;
            if (bar) {
                bar.style.setProperty('--pw', (ratio * 100).toFixed(2) + '%');
                bar.style.setProperty('--px', (max > 0 ? (rail.scrollLeft / max) * ((1 - ratio) / ratio) * 100 : 0).toFixed(2) + '%');
            }
            if (prev) prev.disabled = rail.scrollLeft < 4;
            if (next) next.disabled = rail.scrollLeft > max - 4;
        }
        var beh = reduce.matches ? 'auto' : 'smooth';
        if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step() * 2, behavior: beh }); });
        if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step() * 2, behavior: beh }); });
        rail.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
        window.addEventListener('resize', update);
        rail.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') { e.preventDefault(); rail.scrollBy({ left: step(), behavior: beh }); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); rail.scrollBy({ left: -step(), behavior: beh }); }
        });
        // Arrastre con mouse (en táctil el desplazamiento nativo ya funciona)
        var down = false, moved = false, x0 = 0, s0 = 0;
        rail.addEventListener('pointerdown', function (e) {
            if (e.pointerType !== 'mouse' || e.button !== 0) return;
            down = true; moved = false; x0 = e.clientX; s0 = rail.scrollLeft;
        });
        window.addEventListener('pointermove', function (e) {
            if (!down) return;
            var dx = e.clientX - x0;
            if (!moved && Math.abs(dx) > 6) { moved = true; rail.classList.add('is-drag'); }
            if (moved) rail.scrollLeft = s0 - dx;
        });
        window.addEventListener('pointerup', function () {
            if (!down) return;
            down = false;
            if (moved) {
                rail.classList.remove('is-drag');
                var st = step(), target = Math.round(rail.scrollLeft / st) * st;
                rail.scrollTo({ left: target, behavior: beh });
                rail.addEventListener('click', function stop(ev) { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true });
            }
        });
        update();
    }

    function initTilt(track) {
        track.addEventListener('pointermove', function (e) {
            var card = e.target.closest('.fl-card');
            if (!card || e.pointerType !== 'mouse') return;
            var hit = card.firstElementChild, r = hit.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
            card.classList.add('is-tilting');
            hit.style.setProperty('--ry', ((px - 0.5) * 6).toFixed(2) + 'deg');
            hit.style.setProperty('--rx', ((0.5 - py) * 5).toFixed(2) + 'deg');
            hit.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            hit.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        });
        track.addEventListener('pointerout', function (e) {
            var card = e.target.closest('.fl-card');
            if (!card || card.contains(e.relatedTarget)) return;
            card.classList.remove('is-tilting');
            var hit = card.firstElementChild;
            hit.style.setProperty('--rx', '0deg'); hit.style.setProperty('--ry', '0deg');
        });
    }


    /* ---------- Datos reales (js/product-info.js) ---------- */
    function setText(id, html) { var el = document.getElementById(id); if (el && html) el.innerHTML = html; }
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function applyInfo() {
        var I = window.YOG_INFO || {};
        if (I.presentaciones && I.presentaciones.length) setText('pk-sizes', esc(I.presentaciones.join(' · ')));
        if (I.temperatura) setText('kp-temp', 'Guárdalo refrigerado entre <strong>' + esc(I.temperatura) + '</strong>. No lo dejes al sol ni fuera del frío.');
        if (I.vidaUtilCerradoDias) setText('kp-closed', 'Cerrado y en la nevera dura hasta <strong>' + I.vidaUtilCerradoDias + ' días</strong>. Revisa siempre la fecha impresa.');
        if (I.vidaUtilAbiertoDias) setText('kp-open', 'Tápalo bien, devuélvelo a la nevera y consúmelo en máximo <strong>' + I.vidaUtilAbiertoDias + ' días</strong>.');
        if (I.selloSeguridad === true) setText('pk-cap', 'Con sello de seguridad. Ciérrala bien después de servir.');
        if (I.materialEnvase) setText('pk-seals', 'Envase de ' + esc(I.materialEnvase) + ', con color propio por sabor.');
        if (Array.isArray(I.proceso) && I.proceso.length) {
            document.querySelectorAll('#pc-steps .pc-step').forEach(function (li, i) {
                var st = I.proceso[i]; if (!st) return;
                if (st.titulo) li.querySelector('h3').textContent = st.titulo;
                if (st.texto) li.querySelector('p').textContent = st.texto;
            });
        }
    }

    /* ---------- Línea del proceso: se llena al bajar ---------- */
    function initProcessLine() {
        var line = document.getElementById('pc-line'), sec = document.getElementById('proceso');
        if (!line || !sec) return;
        if (reduce.matches) { line.style.setProperty('--p', 1); return; }
        var ticking = false;
        function upd() {
            ticking = false;
            var r = sec.getBoundingClientRect(), vh = window.innerHeight;
            var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height * 0.9)));
            line.style.setProperty('--p', p.toFixed(3));
        }
        window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
        upd();
    }

    function init() {
        applyInfo();
        paintIcons();
        buildRail();
        initProcessLine();
        watchReveal();
        document.dispatchEvent(new CustomEvent('yog:sections-ready'));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    window.YogSections = { paintIcons: paintIcons, icon: icon };
})();
