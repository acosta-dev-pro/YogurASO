/**
 * Carrito lateral. Se guarda en localStorage y al comprar abre WhatsApp.
 */
(function () {
    'use strict';

    var KEY = 'yogur_cart';
    var HISTORIAL = 'yogur_order_history';
    var U = window.YogurUtils || {};
    var CFG = window.YOGUR_CONFIG || {};
    var esc = U.escapeHtml || String;
    var cop = U.formatCOP || function (n) { return '$' + Number(n || 0).toLocaleString('es-CO'); };
    var enPaginas = location.pathname.indexOf('/pages/') >= 0;
    var raiz = enPaginas ? '../' : '';
    var FOTO_RESPALDO = 'assets/products/yoguraso-fresa-500ml-sm.webp';

    var items = leer();
    var panel, overlay, enviando = false;

    /* ---------- datos ---------- */
    function sinPrefijo(s) { return String(s || '').trim().replace(/^(\.\.\/|\.\/)+/, ''); }

    function leer() {
        try {
            var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
            return (Array.isArray(raw) ? raw : []).filter(function (i) {
                return i && i.id != null && Number(i.cantidad) > 0 && Number(i.precio) >= 0;
            }).map(function (i) {
                return { id: i.id, nombre: String(i.nombre || 'Producto'), precio: Number(i.precio), cantidad: Number(i.cantidad),
                    imagen: sinPrefijo(i.imagen || i.imagen_url), stock: Number.isFinite(Number(i.stock)) ? Number(i.stock) : null, tamano: i.tamano || '' };
            });
        } catch (e) { return []; }
    }

    function guardar() {
        try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* sin espacio */ }
        pintar();
        window.dispatchEvent(new CustomEvent('yogur:cart-updated'));
    }

    function total() { return items.reduce(function (s, i) { return s + i.precio * i.cantidad; }, 0); }
    function unidades() { return items.reduce(function (s, i) { return s + i.cantidad; }, 0); }
    function aviso(msg, tipo) { if (tipo !== 'success' && tipo !== 'info' && U.showToast) U.showToast(msg, tipo); }
    function buscar(id) { return items.filter(function (x) { return String(x.id) === String(id); })[0]; }

    /** Nombre y presentación: "Fresa · 1 Litro" → { name: 'Fresa', size: '1 Litro' } */
    function partes(i) {
        var nombre = String(i.nombre).split('·');
        return { name: nombre[0].trim(), size: i.tamano || nombre.slice(1).join('·').trim() };
    }

    function foto(i) {
        var s = i.imagen || FOTO_RESPALDO;
        if (/^(https?:|data:|blob:)/i.test(s)) return s;
        return raiz + s.replace(/-500ml\.webp/, '-500ml-sm.webp');
    }

    /** Código corto del pedido (siempre el mismo para el mismo carrito). */
    function codigo() {
        var raw = items.map(function (i) { return [i.id, i.cantidad, i.precio].join(':'); }).join('|') || 'vacio', h = 2166136261;
        for (var k = 0; k < raw.length; k++) { h ^= raw.charCodeAt(k); h = Math.imul(h, 16777619); }
        return 'YG-' + String(h >>> 0).padStart(10, '0').slice(-8);
    }

    /** Barras del ticket, dibujadas a partir del código. */
    function barras(code) {
        var bits = [1, 1, 0, 1];
        for (var k = 0; k < code.length; k++) {
            for (var b = 0; b < 6; b++) bits.push((code.charCodeAt(k) >> b) & 1);
            bits.push(k % 2 ? 0 : 1, 0);
        }
        bits.push(1, 0, 1, 1);
        var w = 1.35, rects = '', ini = -1;
        bits.concat(0).forEach(function (v, k) {
            if (v && ini < 0) ini = k;
            else if (!v && ini >= 0) { rects += '<rect x="' + (ini * w).toFixed(2) + '" y="0" width="' + Math.max(0.8, (k - ini) * w - 0.25).toFixed(2) + '" height="34"/>'; ini = -1; }
        });
        return '<svg class="cart-barcode" viewBox="0 0 ' + (bits.length * w).toFixed(2) + ' 34" preserveAspectRatio="none" role="img" aria-label="Código ' + esc(code) + '">' + rects + '</svg>';
    }

    /** Color de la línea de cada producto según su sabor (los colores salen de brand.css). */
    function tono(i) {
        var n = String(i.nombre).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        var mapa = [['fresa', 'fresa', '#9E2530'], ['guanabana', 'guanabana', '#356628'], ['mango', 'mango', '#A85A06'], ['pina', 'pina', '#8A6408'],
            ['mora', 'mora', '#6A2A56'], ['melocoton', 'melocoton', '#A34A16'], ['durazno', 'melocoton', '#A34A16'], ['frutos', 'frutos-rojos', '#8E243E'], ['cafe', 'cafe', '#5C382C']];
        for (var k = 0; k < mapa.length; k++) {
            if (n.indexOf(mapa[k][0]) >= 0) return '--chip-line:var(--bg-' + mapa[k][1] + ');--chip-wash:var(--fondo-claro-' + mapa[k][1] + ');--chip-ink:' + mapa[k][2];
        }
        return '--chip-line:var(--rojo-marca);--chip-wash:#F6F1EA;--chip-ink:#1F1B1A';
    }

    /* ---------- acciones ---------- */
    /** p: { id, lineId?, nombre, tamano?, precio, imagen_url?, stock?, cantidad? } */
    function addToCart(p) {
        if (!p || p.id == null) return;
        var cant = Math.max(1, Number(p.cantidad) || 1);
        var id = p.lineId || p.id;
        var stock = Number.isFinite(Number(p.stock)) ? Number(p.stock) : null;
        var linea = buscar(id);
        var nuevo = (linea ? linea.cantidad : 0) + cant;
        if (stock !== null && nuevo > stock) return aviso(stock <= 0 ? 'Producto sin stock' : 'No hay más stock disponible', 'warning');
        if (linea) { linea.cantidad = nuevo; linea.precio = Number(p.precio) || linea.precio; linea.stock = stock; if (!linea.imagen) linea.imagen = sinPrefijo(p.imagen_url || p.imagen); }
        else items.push({ id: id, nombre: p.tamano ? p.nombre + ' · ' + p.tamano : p.nombre, precio: Number(p.precio) || 0, cantidad: cant,
            imagen: sinPrefijo(p.imagen_url || p.imagen), stock: stock, tamano: p.tamano || '' });
        guardar();
    }

    function cambiarCantidad(id, delta) {
        var i = buscar(id);
        if (!i) return;
        var n = i.cantidad + delta;
        if (n <= 0) return quitar([id]);
        if (i.stock !== null && n > i.stock) return aviso('Stock máximo alcanzado', 'warning');
        i.cantidad = n;
        guardar();
    }

    /** Diálogo "¿Quitar del carrito?". Devuelve una promesa con true si la persona confirma. */
    function confirmar(titulo, nombre, boton) {
        return new Promise(function (resolve) {
            var previo = document.activeElement;
            var fondo = document.createElement('div');
            fondo.className = 'cfx-confirm-wrap is-in';
            fondo.innerHTML = '<div class="cfx-confirm" role="alertdialog" aria-modal="true" aria-labelledby="cfx-confirm-title">' +
                (nombre ? '<p class="cfx-confirm-name">' + esc(nombre) + '</p>' : '') +
                '<h2 class="cfx-confirm-title" id="cfx-confirm-title">' + esc(titulo) + '</h2>' +
                '<div class="cfx-confirm-actions"><button type="button" class="cfx-confirm-cancel">Cancelar</button>' +
                '<button type="button" class="cfx-confirm-ok">' + esc(boton) + '</button></div></div>';
            var ok = fondo.querySelector('.cfx-confirm-ok'), no = fondo.querySelector('.cfx-confirm-cancel');
            function fin(valor) {
                document.removeEventListener('keydown', tecla, true);
                fondo.remove();
                if (previo && previo.focus && document.contains(previo)) previo.focus({ preventScroll: true });
                resolve(valor);
            }
            function tecla(e) {
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fin(false); }
                else if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === ok ? no : ok).focus(); }
            }
            // Los clics dentro no cierran el carrito de fondo.
            fondo.addEventListener('click', function (e) { e.stopPropagation(); if (e.target === fondo) fin(false); });
            fondo.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
            ok.addEventListener('click', function () { fin(true); });
            no.addEventListener('click', function () { fin(false); });
            document.addEventListener('keydown', tecla, true);
            document.body.appendChild(fondo);
            ok.focus({ preventScroll: true });
        });
    }

    /** Quita productos (pide confirmación). */
    function quitar(ids) {
        var uno = ids.length === 1 && buscar(ids[0]);
        var nombre = uno ? [partes(uno).name, partes(uno).size].filter(Boolean).join(' · ') : ids.length + ' productos seleccionados';
        return confirmar('¿Quitar del carrito?', nombre, 'Quitar').then(function (ok) {
            if (!ok) return;
            items = items.filter(function (x) { return ids.map(String).indexOf(String(x.id)) < 0; });
            guardar();
        });
    }

    function vaciar() {
        if (!items.length) return;
        confirmar('¿Vaciar el carrito?', unidades() + ' producto' + (unidades() === 1 ? '' : 's') + ' en el carrito', 'Vaciar').then(function (ok) {
            if (ok) { items = []; guardar(); }
        });
    }

    /* ---------- panel ---------- */
    function cargarEstilo() {
        if (document.getElementById('cart-ticket-css')) return;
        var l = document.createElement('link');
        l.id = 'cart-ticket-css';
        l.rel = 'stylesheet';
        var s = document.querySelector("script[src*='cart.js']");
        var src = s ? s.getAttribute('src') : 'js/cart.js';
        l.href = src.replace(/js\/cart\.js(\?.*)?$/, 'css/cart-ticket.css') + ((src.match(/\?.*$/) || [''])[0]);
        document.head.appendChild(l);
    }

    function construir() {
        cargarEstilo();
        [].forEach.call(document.querySelectorAll('#cartSidebar, #cartOverlay'), function (el) { el.remove(); });
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'cartOverlay';
        panel = document.createElement('aside');
        panel.id = 'cartSidebar';
        panel.className = 'cart-sidebar cart-ticket';
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('aria-label', 'Carrito');
        var lugar = String(CFG.COMPANY_LOCATION || '').trim();
        panel.innerHTML =
            '<div class="cart-header"><span class="cart-ticket-headcopy"><span class="cart-ticket-title">Carrito</span><span class="cart-ticket-sub" id="cartTicketSub"></span></span>' +
                '<i class="fas fa-times" id="closeCart" role="button" tabindex="0" aria-label="Cerrar carrito"></i></div>' +
            '<div class="cart-sheet">' +
                '<div class="cart-sheet-brand"><div class="cart-sheet-logo">YogurASO</div><p>' + esc(lugar ? 'Yogurt artesanal · ' + lugar : 'Yogurt artesanal') + '</p></div>' +
                '<div class="cart-cut" aria-hidden="true"></div>' +
                '<div class="cart-items" id="cart-sidebar-items"></div>' +
                '<div class="cart-sheet-bottom"><div class="cart-cut" aria-hidden="true"></div>' +
                    '<div class="cart-total cart-ticket-sum">' +
                        '<div class="cart-subline"><span id="cartSubLabel">Subtotal</span><span class="num" id="cartSubAmount">$0</span></div>' +
                        '<div class="cart-grand"><span>TOTAL</span><span class="num" id="cartTotalAmount">$0</span></div>' +
                        '<div class="cart-barcode-wrap" id="cartBarcode" aria-hidden="true"></div><p class="cart-order-code" id="cartOrderCode"></p>' +
                    '</div></div>' +
            '</div>' +
            '<div class="cart-ticket-foot"><button type="button" class="btn-clear-cart" id="btn-clear-cart-sidebar" hidden>Vaciar</button>' +
                '<button type="button" class="checkout-btn" id="checkoutBtn"><i class="fab fa-whatsapp" aria-hidden="true"></i> Comprar por WhatsApp</button></div>';
        document.body.append(overlay, panel);

        overlay.addEventListener('click', cerrar);
        panel.querySelector('#closeCart').addEventListener('click', cerrar);
        panel.querySelector('#closeCart').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cerrar(); } });
        panel.querySelector('#btn-clear-cart-sidebar').addEventListener('click', vaciar);
        panel.querySelector('#checkoutBtn').addEventListener('click', function () { comprar(false); });

        var lista = panel.querySelector('#cart-sidebar-items');
        lista.addEventListener('click', function (e) {
            var b = e.target.closest('[data-action]');
            if (!b) return;
            var a = b.dataset.action;
            if (a === 'qty') cambiarCantidad(b.dataset.id, Number(b.dataset.delta));
            else if (a === 'remove') quitar([b.dataset.id]);
            else if (a === 'remove-selected') quitar(marcados());
        });
        lista.addEventListener('change', function (e) {
            if (e.target.dataset.action === 'toggle-all') [].forEach.call(lista.querySelectorAll('.cart-item-check'), function (c) { c.checked = e.target.checked; });
            if (e.target.classList.contains('cart-item-check') || e.target.dataset.action === 'toggle-all') seleccion();
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
    }

    function marcados() {
        return [].map.call(panel.querySelectorAll('.cart-item-check:checked'), function (c) { return c.dataset.id; });
    }

    /** Estado de "Todos" y del botón Eliminar, y resalta los productos marcados. */
    function seleccion() {
        var cajas = [].slice.call(panel.querySelectorAll('.cart-item-check'));
        var n = cajas.filter(function (c) { return c.checked; }).length;
        var todos = panel.querySelector('[data-action="toggle-all"]'), borrar = panel.querySelector('[data-action="remove-selected"]');
        if (todos) { todos.checked = cajas.length > 0 && n === cajas.length; todos.indeterminate = n > 0 && n < cajas.length; }
        if (borrar) { borrar.disabled = n === 0; borrar.textContent = n ? 'Eliminar (' + n + ')' : 'Eliminar'; }
        cajas.forEach(function (c) { c.closest('.cart-chip').classList.toggle('is-selected', c.checked); });
    }

    function pintar() {
        var badge = document.getElementById('cart-count');
        if (badge) { badge.textContent = unidades(); badge.hidden = !items.length; badge.setAttribute('aria-label', unidades() + ' productos en el carrito'); }
        if (!panel) return;
        var u = unidades(), lista = panel.querySelector('#cart-sidebar-items');
        var marcadosAntes = marcados().map(String);
        panel.classList.toggle('is-empty', !items.length);
        panel.querySelector('#btn-clear-cart-sidebar').hidden = !items.length;
        panel.querySelector('#cartTicketSub').textContent = u ? u + (u === 1 ? ' producto' : ' productos') : 'Sin productos';
        panel.querySelector('#cartSubLabel').textContent = u ? 'Subtotal (' + u + (u === 1 ? ' ud.' : ' uds.') + ')' : 'Subtotal';
        panel.querySelector('#cartSubAmount').textContent = cop(total());
        panel.querySelector('#cartTotalAmount').textContent = cop(total());
        panel.querySelector('#cartBarcode').innerHTML = items.length ? barras(codigo()) : '';
        panel.querySelector('#cartOrderCode').textContent = items.length ? codigo() : '';

        if (!items.length) {
            lista.innerHTML = '<div class="cart-empty-state is-compact"><div class="cart-empty-icon" aria-hidden="true"><i class="fas fa-shopping-bag"></i></div>' +
                '<p class="cart-empty-title">Tu carrito está vacío</p><p class="cart-empty-text">Elige tus sabores y arma tu pedido en segundos.</p>' +
                '<a class="cart-empty-cta" href="' + (enPaginas ? '' : 'pages/') + 'productos.html">Ver sabores</a></div>';
            return;
        }
        lista.innerHTML =
            '<div class="cart-select-bar"><label class="cart-select-all"><input type="checkbox" data-action="toggle-all" aria-label="Seleccionar todos"><span>Todos</span></label>' +
            '<button type="button" class="cart-remove-selected" data-action="remove-selected" disabled>Eliminar</button></div>' +
            items.map(function (i) {
                var m = partes(i), id = esc(i.id);
                return '<article class="cart-chip" data-id="' + id + '" style="' + tono(i) + '">' +
                    '<label class="cart-pick"><input type="checkbox" class="cart-item-check" data-id="' + id + '" aria-label="Seleccionar ' + esc(m.name) + '"></label>' +
                    '<div class="cart-chip-top"><div class="cart-chip-lead"><span class="cart-flavor-shot" aria-hidden="true"><img src="' + esc(foto(i)) + '" alt="" decoding="async"></span>' +
                        '<div class="cart-chip-info"><div class="cart-chip-name">' + esc(m.name) + '</div><div class="cart-chip-meta">' + esc([m.size, cop(i.precio) + ' c/u'].filter(Boolean).join(' · ')) + '</div></div></div>' +
                        '<button type="button" class="cart-chip-x" data-action="remove" data-id="' + id + '" aria-label="Quitar ' + esc(m.name) + '">×</button></div>' +
                    '<div class="cart-chip-bot"><div class="cart-chip-step">' +
                        '<button type="button" class="cart-qty-btn" data-action="qty" data-id="' + id + '" data-delta="-1" aria-label="Disminuir cantidad">−</button>' +
                        '<span class="cart-item-qty" aria-label="Cantidad">' + i.cantidad + '</span>' +
                        '<button type="button" class="cart-qty-btn" data-action="qty" data-id="' + id + '" data-delta="1" aria-label="Aumentar cantidad">+</button></div>' +
                        '<span class="cart-chip-price num">' + cop(i.precio * i.cantidad) + '</span></div></article>';
            }).join('');
        [].forEach.call(lista.querySelectorAll('.cart-item-check'), function (c) { c.checked = marcadosAntes.indexOf(String(c.dataset.id)) >= 0; });
        seleccion();
    }

    function abrir() {
        items = leer();
        pintar();
        panel.classList.add('show', 'cart-ticket-ready');
        overlay.classList.add('show');
        panel.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cart-open');
    }

    function cerrar() {
        if (!panel) return;
        panel.classList.remove('show');
        overlay.classList.remove('show');
        panel.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cart-open');
    }

    /* ---------- pedido por WhatsApp ---------- */
    function usuario() {
        try { return JSON.parse(localStorage.getItem('usuario') || 'null') || {}; } catch (e) { return {}; }
    }
    function nombreCliente() { var u = usuario(); return ((u.nombre || '') + ' ' + (u.apellido || '')).trim(); }

    function mensaje(pedido) {
        var ok = pedido && pedido.success && Number.isFinite(Number(pedido.total));
        var h = new Date().getHours(), saludo = h < 12 ? 'buenos días' : h < 19 ? 'buenas tardes' : 'buenas noches';
        var lineas = ok && Array.isArray(pedido.items) && pedido.items.length
            ? pedido.items.map(function (r) {
                var q = Number(r.quantity || 0), p = Number(r.unit_price || 0);
                return (r.product_name || 'Producto') + '\n   ' + q + ' × ' + cop(p) + ' = ' + cop(Number(r.subtotal != null ? r.subtotal : p * q));
            })
            : items.map(function (i) {
                var m = partes(i);
                return m.name + (m.size ? ' · ' + m.size : '') + '\n   ' + i.cantidad + ' × ' + cop(i.precio) + ' = ' + cop(i.precio * i.cantidad);
            });
        var codigoPedido = ok && pedido.order_number ? pedido.order_number : codigo();
        var n = nombreCliente();
        return ['Hola ' + (CFG.COMPANY_NAME || 'YogurASO') + ', ' + saludo + '.'].concat(
            n ? ['Soy ' + n + '.'] : [], ['', 'Quiero hacer este pedido:', ''],
            lineas.map(function (l, k) { return (k + 1) + '. ' + l; }),
            ['', 'Total: ' + cop(ok ? Number(pedido.total) : total()) + ' (' + unidades() + (unidades() === 1 ? ' unidad)' : ' unidades)'),
                'Código de pedido: ' + codigoPedido, '',
                'Entrega en ' + (CFG.COMPANY_LOCATION || 'Neiva y Tello, Huila') + '. Quedo atento a la confirmación, la disponibilidad y los datos de entrega.', '', 'Gracias.']
        ).join('\n');
    }

    /** Guarda el pedido en Supabase. Nunca falla: si no se puede, el pedido sigue por WhatsApp. */
    function registrar() {
        var u = usuario();
        var datos = { name: nombreCliente() || undefined, phone: u.telefono || undefined, email: u.email || undefined };
        var espera = new Promise(function (ok) { setTimeout(function () { ok({ success: false }); }, 8000); });
        return Promise.race([import('./api.js').then(function (api) { return api.createOrder(items, datos); }), espera])
            .then(function (r) { return r || { success: false }; }, function () { return { success: false }; });
    }

    function guardarHistorial(numero) {
        var u = usuario(), h = [];
        try { h = JSON.parse(localStorage.getItem(HISTORIAL) || '[]'); } catch (e) { /* vacío */ }
        h.unshift({ id: 'WA-' + Date.now(), orderNumber: numero || null, userId: u.id || null, email: u.email || null, createdAt: new Date().toISOString(), total: total(),
            items: items.map(function (i) { return { id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, tamano: i.tamano }; }) });
        try { localStorage.setItem(HISTORIAL, JSON.stringify(h.slice(0, 40))); } catch (e) { /* sin espacio */ }
    }

    /** "Revisa tu pedido": lo que se va a enviar. Devuelve true si la persona confirma. */
    function revisar() {
        return new Promise(function (resolve) {
            var fondo = document.createElement('div');
            fondo.className = 'order-preview-overlay';
            fondo.setAttribute('role', 'dialog');
            fondo.setAttribute('aria-modal', 'true');
            fondo.innerHTML = '<div class="order-preview"><p class="order-preview-kicker">Antes de WhatsApp</p><h3>Revisa tu pedido</h3>' +
                '<p class="order-preview-lead">Esto es lo que vas a enviar. Si está bien, se abre WhatsApp con el mensaje listo.</p><ul class="order-preview-list">' +
                items.map(function (i) {
                    var m = partes(i);
                    return '<li><strong>' + esc(m.name) + '</strong><span>' + (m.size ? esc(m.size) + ' · ' : '') + i.cantidad + ' und. · ' + cop(i.precio * i.cantidad) + '</span></li>';
                }).join('') + '</ul><div class="order-preview-total"><span>' + items.length + ' referencias · ' + unidades() + ' unidades</span><strong>' + cop(total()) + '</strong></div>' +
                '<div class="order-preview-actions"><button type="button" class="order-preview-cancel">Seguir editando</button>' +
                '<button type="button" class="order-preview-ok"><i class="fab fa-whatsapp" aria-hidden="true"></i> Enviar pedido</button></div></div>';
            function fin(ok) { fondo.remove(); document.removeEventListener('keydown', tecla); resolve(ok); }
            function tecla(e) { if (e.key === 'Escape') fin(false); }
            fondo.addEventListener('click', function (e) { if (e.target === fondo) fin(false); });
            fondo.querySelector('.order-preview-cancel').addEventListener('click', function () { fin(false); });
            fondo.querySelector('.order-preview-ok').addEventListener('click', function () { fin(true); });
            document.addEventListener('keydown', tecla);
            document.body.appendChild(fondo);
            fondo.querySelector('.order-preview-ok').focus();
        });
    }

    /** Comprar: el botón del carrito envía directo; con vistaPrevia se pide confirmar antes. */
    function comprar(vistaPrevia) {
        if (!items.length) return aviso('Tu carrito está vacío', 'warning');
        if (enviando) return;
        (vistaPrevia ? revisar() : Promise.resolve(true)).then(function (ok) { if (ok) enviar(); });
    }

    function enviar() {
        if (enviando) return;
        enviando = true;
        // La pestaña se abre ya, dentro del clic, para que el navegador no la bloquee.
        var ventana = null;
        try { ventana = window.open('', '_blank'); } catch (e) { /* bloqueada */ }
        if (ventana) { try { ventana.opener = null; ventana.document.body.textContent = 'Preparando tu pedido…'; } catch (e) { /* sigue sirviendo */ } }
        var btn = document.getElementById('checkoutBtn'), antes = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Registrando pedido…'; }
        registrar().then(function (pedido) {
            if (!pedido.success) aviso('No pudimos registrar el pedido en la tienda. Igual te abrimos WhatsApp con el pedido.', 'warning');
            guardarHistorial(pedido.success ? pedido.order_number : null);
            var url = 'https://wa.me/' + String(CFG.WHATSAPP_NUMBER || '573103279958').replace(/\D/g, '') + '?text=' + encodeURIComponent(mensaje(pedido));
            try { if (window.YogAnalytics && window.YogAnalytics.trackOrder) window.YogAnalytics.trackOrder(); } catch (e) { /* métricas opcionales */ }
            if (ventana && !ventana.closed) ventana.location.replace(url);
            else if (!window.open(url, '_blank')) location.href = url;
        }).then(function () {
            enviando = false;
            if (btn) { btn.disabled = false; btn.innerHTML = antes; }
        });
    }

    /* ---------- arranque ---------- */
    function iniciar() {
        construir();
        pintar();
        var btn = document.getElementById('cartBtn');
        if (btn) btn.addEventListener('click', function (e) { e.preventDefault(); abrir(); });
    }

    window.Cart = {
        addToCart: addToCart,
        getCart: function () { items = leer(); return items.map(function (i) { return Object.assign({}, i); }); },
        getCartTotal: total,
        updateCounter: function () { items = leer(); pintar(); },
        clearCart: function () { items = []; guardar(); },
        clearCartConfirm: vaciar,
        renderSidebar: pintar,
        openSidebar: function () { if (panel) abrir(); },
        closeSidebar: cerrar,
        checkoutWhatsApp: function () { comprar(true); },
        showToast: function (m, t) { aviso(m, t || 'success'); }
    };

    window.addEventListener('storage', function (e) { if (e.key === KEY) { items = leer(); pintar(); } });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
