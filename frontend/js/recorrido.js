/* recorrido.js — Proceso: el camino en zigzag entre las tarjetas y la flecha que lo recorre.
   - arma() dibuja la curva (fondo punteado + trazo) pasando por cada tarjeta y terminando en la última.
   - Al bajar, la flecha avanza por la curva, el trazo se completa detrás de ella y cada tarjeta
     por la que ya pasó recibe .is-llegado (el CSS la pinta en rojo pastel). Sin más animación. */
(function () {
    'use strict';

    var seccion = document.querySelector('[data-recorrido]');
    if (!seccion) return;
    var pasos = seccion.querySelector('.rc-pasos');
    var svg = seccion.querySelector('.rc-camino');
    var fondo = seccion.querySelector('.rc-camino-fondo');
    var trazo = seccion.querySelector('.rc-camino-trazo');
    var items = [].slice.call(seccion.querySelectorAll('.rc-paso'));
    var dock = seccion.querySelector('.rc-dock-frame');
    if (!pasos || !svg || !fondo || !trazo || !items.length) return;

    var flecha = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    flecha.setAttribute('class', 'rc-flecha');
    flecha.setAttribute('d', 'M14 0 L-9 -11 L-9 11 Z');
    svg.appendChild(flecha);

    var muestras = [];   // puntos de la curva: { s: distancia, x, y }
    var largo = 0;
    var nodosY = [];     // altura del centro de cada tarjeta, dentro de .rc-pasos
    var libre = true;

    function arma() {
        var W = pasos.clientWidth, H = pasos.clientHeight;
        if (W <= 0 || H <= 0) return;
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

        var caja = pasos.getBoundingClientRect();
        var movil = window.innerWidth <= 860;
        var izqMax = 0, derMin = W;   // bordes del corredor libre entre tarjetas izquierdas y derechas

        items.forEach(function (li, i) {
            var r = (li.querySelector('.rc-tarjeta') || li).getBoundingClientRect();
            if (i % 2 === 0) derMin = Math.min(derMin, r.left - caja.left);
            else izqMax = Math.max(izqMax, r.right - caja.left);
        });
        var corredor = (izqMax > 0 && derMin < W && derMin > izqMax) ? (izqMax + derMin) / 2 : W / 2;

        nodosY = [];
        var puntos = [{ x: corredor, y: 0 }];
        items.forEach(function (li, i) {
            var r = (li.querySelector('.rc-tarjeta') || li).getBoundingClientRect();
            var y = r.top + r.height / 2 - caja.top;
            nodosY.push(y);
            var x;
            if (movil) x = i % 2 === 0 ? Math.max(46, Math.min(52, izqMax * 0.42)) : Math.min(W - 46, Math.max(W - 52, derMin + (W - derMin) * 0.58));
            else x = i % 2 === 0 ? corredor - 36 : corredor + 36;
            puntos.push({ x: x, y: y });
        });
        if (dock) {   // la curva termina en el centro del recuadro del paso 5
            var rd = dock.getBoundingClientRect();
            var yd = rd.top + rd.height / 2 - caja.top;
            nodosY.push(yd);
            puntos.push({ x: rd.left + rd.width / 2 - caja.left, y: yd });
        }

        // Curva suave (Catmull-Rom) por todos los puntos
        var d = 'M ' + puntos[0].x.toFixed(1) + ' ' + puntos[0].y.toFixed(1);
        for (var i = 0; i < puntos.length - 1; i++) {
            var p0 = puntos[i - 1] || puntos[i], p1 = puntos[i], p2 = puntos[i + 1], p3 = puntos[i + 2] || p2;
            d += ' C ' + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + ' ' + (p1.y + (p2.y - p0.y) / 6).toFixed(1) +
                ', ' + (p2.x - (p3.x - p1.x) / 6).toFixed(1) + ' ' + (p2.y - (p3.y - p1.y) / 6).toFixed(1) +
                ', ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
        }
        fondo.setAttribute('d', d);
        trazo.setAttribute('d', d);
        largo = trazo.getTotalLength();
        trazo.style.strokeDasharray = largo + ' ' + largo;

        muestras = [];
        for (var k = 0; k <= 400; k++) {
            var s = largo * k / 400, p = trazo.getPointAtLength(s);
            muestras.push({ s: s, x: p.x, y: p.y });
        }
        mover();
    }

    /* Coloca la flecha donde la curva cruza la línea de lectura (55 % de la pantalla). */
    function mover() {
        libre = true;
        if (!muestras.length) return;
        var y = window.innerHeight * 0.55 - pasos.getBoundingClientRect().top;
        var i = 0;
        while (i < muestras.length - 1 && muestras[i].y < y) i++;
        var a = muestras[Math.max(0, i - 1)], b = muestras[i];
        var antes = y < muestras[0].y;
        trazo.style.strokeDashoffset = antes ? largo : largo - b.s;
        flecha.style.display = antes ? 'none' : '';
        flecha.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + ') rotate(' +
            (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI).toFixed(1) + ')');
        items.forEach(function (li, k) { li.classList.toggle('is-llegado', nodosY[k] <= y); });
        if (dock) dock.classList.toggle('is-llegado', nodosY[items.length] <= y);
    }

    function pedir() { if (libre) { libre = false; requestAnimationFrame(mover); } }

    window.addEventListener('scroll', pedir, { passive: true });
    var ancho = window.innerWidth;
    window.addEventListener('resize', function () {
        if (Math.abs(window.innerWidth - ancho) < 2) return;   // el móvil cambia el alto al bajar; solo importa el ancho
        ancho = window.innerWidth;
        arma();
    });
    window.addEventListener('load', arma);
    arma();
    setTimeout(arma, 200);
})();
