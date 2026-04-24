/* ficha-modal.js — Ficha de producto interactiva al tocar cualquier yogur.
   Muestra ingredientes naturales, información nutricional, disponibilidad real de stock,
   modo de conservación y soporte dinámico para presentaciones de 500 ml y 1 Litro. */
(function () {
    'use strict';

    var ASSET_BASE = (String(location.pathname || '').indexOf('/pages/') >= 0) ? '../' : '';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var NUM = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
    var LABEL = {
        fresa: 'roja',
        pina: 'amarilla',
        mora: 'morada',
        melocoton: 'naranja',
        'frutos-rojos': 'fucsia',
        cafe: 'café',
        guanabana: 'verde',
        mango: 'ámbar'
    };

    var ICON = {
        x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
        cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.4 11.2a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 1.9-1.5L21.5 7H6"/></svg>',
        minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
        plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
    };

    function flavors() { return window.YOGUR_FLAVORS || []; }
    function info() { return window.YOG_INFO || {}; }
    function flavorOf(slug) { return flavors().find(function (f) { return f.slug === slug; }) || null; }
    function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function cop(n) { return (window.YogurUtils && window.YogurUtils.formatCOP) ? window.YogurUtils.formatCOP(n) : '$' + Number(n || 0).toLocaleString('es-CO'); }
    function asset(rel) {
        var s = String(rel || '').trim();
        if (!s || /^(https?:|data:|blob:|\/|\.\.\/)/i.test(s)) return s;
        return ASSET_BASE + s.replace(/^\.\//, '');
    }

    function basePriceForSize(p, size) {
        var base500 = Number(p.precio || 0);
        if (!base500) return 0;
        if (size === '1 Litro' || size === '1 L') {
            var p1l = Number(p.precio_1l || 0);
            if (p1l > 0) return p1l;
            return Math.round((base500 * 1.75) / 100) * 100;
        }
        return base500;
    }

    function priceForSize(p, size) {
        var base = basePriceForSize(p, size);
        if (!base) return 0;
        var off = Number(p.descuento || 0);
        if (off > 0 && off < 100) {
            return Math.max(500, Math.round((base * (1 - off / 100)) / 100) * 100);
        }
        return base;
    }

    /* Producto: sincroniza el registro en vivo de YogCatalog con los datos recibidos */
    function productFor(slug, given) {
        var f = flavorOf(slug) || {};
        var cat = (given && given.id != null && window.YogCatalog && window.YogCatalog.byId && window.YogCatalog.byId[String(given.id)])
            || (window.YogCatalog && window.YogCatalog.bySlug && window.YogCatalog.bySlug[slug]);
        var p = Object.assign({}, cat || {}, given || {});
        return {
            id: p.id != null ? p.id : 'local-' + slug,
            nombre: p.nombre || f.nombre || slug,
            categoria: p.categoria || '',
            precio: p.precio != null ? Number(p.precio) : 6900,
            precio_1l: p.precio_1l != null ? Number(p.precio_1l) : 0,
            descuento: Number(p.descuento || 0),
            precio_venta: p.precio_venta,
            stock: p.stock != null ? Number(p.stock) : 99,
            descripcion: p.descripcion || '',
            imagen_url: p.imagen_url || f.img500 || '',
            color_fondo: p.color_fondo || f.light || '',
            color_dark: p.color_dark || f.dark || '',
            alt: f.alt || ('Yogurt artesanal ' + (p.nombre || slug) + ', 500 ml')
        };
    }

    function pill(kind) {
        if (info().marcarPendientes === false) return '';
        var t = kind === 'verify' ? 'Verificar' : 'Por confirmar';
        return '<span class="yfm-pill' + (kind === 'verify' ? ' is-verify' : '') + '" title="Dato pendiente de confirmar por YogurASO">' + t + '</span>';
    }
    var DOTS = '<span class="yfm-dots" aria-hidden="true"></span>';
    function pendingCell(prefix) {
        return (prefix ? '<span>' + esc(prefix) + '</span>' : '') + DOTS + '<span class="visually-hidden">Dato pendiente</span>' + pill('confirm');
    }
    function list(a) { return Array.isArray(a) && a.length ? a.join(', ') : ''; }

    function rows(slug, p, selectedSize) {
        var I = info(), d = (I.sabores && I.sabores[slug]) || {};
        var size = selectedSize || current.size || '500 ml';
        var ingr = list(d.ingredientes) || list(I.ingredientesBase);
        var seals = Array.isArray(I.sellosEtiqueta) ? I.sellosEtiqueta : [];
        var nutri = d.nutricion || d.infoNutricional || I.infoNutricional || '';
        var pending = 0;
        function cell(val, prefix) { if (val) return esc(val); pending++; return pendingCell(prefix); }

        var stockNum = Number.isFinite(Number(p.stock)) ? Number(p.stock) : 99;
        var stockText = stockNum <= 0
            ? 'Agotado temporalmente (0 unidades)'
            : (stockNum <= 10
                ? '¡Últimas ' + stockNum + ' unidades disponibles!'
                : 'En stock · ' + stockNum + ' unidades disponibles');

        var r = [];
        r.push(['Presentación', esc('Botella de ' + size), 'yfm-row-pres']);
        r.push(['Disponibilidad', esc(stockText), 'yfm-row-stock']);
        r.push(['Tipo', esc('Yogurt artesanal sabor ' + String(p.nombre).toLowerCase())]);
        r.push(['Ingredientes', cell(ingr)]);
        r.push(null); // separador grueso
        if (seals.length) {
            r.push(['Sellos de etiqueta', esc(seals.join(' · ')) + (I.sellosConfirmados ? '' : pill('verify'))]);
        } else r.push(['Sellos de etiqueta', cell('')]);
        r.push(['Conservación', esc(I.vidaUtilCerradoDias
            ? 'Siempre en nevera · hasta ' + I.vidaUtilCerradoDias + ' días cerrado (revisa la fecha impresa)'
            : 'Siempre en nevera · fecha impresa en el envase')]);
        r.push(['Temperatura', cell(I.temperatura)]);
        r.push(['Una vez abierto', I.vidaUtilAbiertoDias
            ? esc('Tápalo bien · consumir en máximo ' + I.vidaUtilAbiertoDias + ' días')
            : (pending++, pendingCell('Tápalo bien · días'))]);
        r.push(['Información nutricional', cell(nutri)]);

        var html = r.map(function (x) {
            if (!x) return '<div class="yfm-sep" role="presentation"></div>';
            var extraClass = x[2] ? ' ' + x[2] : '';
            return '<div class="yfm-row' + extraClass + '"><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>';
        }).join('');
        return { html: html, pending: pending };
    }

    function content(slug) {
        var f = flavorOf(slug) || { slug: slug, nombre: slug };
        var p = productFor(slug, current.product);
        var I = info(), d = (I.sabores && I.sabores[slug]) || {};
        var price = priceForSize(p, current.size);
        var basePrice = basePriceForSize(p, current.size);
        var ask = !Number(p.precio);
        var out = Number(p.stock) <= 0;
        var lead = p.descripcion || d.nota || ('El equilibrio perfecto entre cremosidad y el sabor natural de ' + String(p.nombre).toLowerCase() + '.');
        var n = flavors().length;
        var color = LABEL[slug];
        var caption = '<strong>Una botella artesanal, ' + (NUM[n] || n) + ' sabores.</strong> Disponible en 500 ml y 1 Litro; el color de la etiqueta te dice el sabor.' +
            (color ? ' La de ' + esc(String(p.nombre).toLowerCase()) + ' es la ' + color + '.' : '');
        var officialSet = { fresa: 1, pina: 1, mora: 1, melocoton: 1, 'frutos-rojos': 1, cafe: 1, guanabana: 1, mango: 1 };
        var rawImg = String(p.imagen_url || '').trim();
        var isOfficialSlug = Boolean(officialSet[slug]);
        var isExactStandardBottle = isOfficialSlug && (!rawImg || rawImg.indexOf('yoguraso-' + slug + '-500ml') >= 0);
        var hasStandard = isOfficialSlug && isExactStandardBottle;
        var base = hasStandard ? asset('assets/products/yoguraso-' + slug + '-500ml') : '';
        var customImg = rawImg ? asset(rawImg) : asset('assets/products/yoguraso-fresa-500ml.webp');
        var imgTag = hasStandard
            ? '<img class="yfm-bottle" src="' + base + '.webp" srcset="' + base + '-sm.webp 320w, ' + base + '.webp 640w" sizes="(max-width: 720px) 34vw, 210px" alt="' + esc(p.alt) + '" width="640" height="1110" decoding="async">'
            : '<img class="yfm-bottle" src="' + esc(customImg) + '" alt="' + esc(p.alt) + '" width="640" height="1110" decoding="async">';
        var bgStyle = (/^#[0-9a-f]{6}$/i.test(String(p.color_fondo || '')) && String(p.color_fondo).toUpperCase() !== '#FFF8F4')
            ? String(p.color_fondo)
            : 'var(--fondo-claro-' + esc(slug) + ', var(--fondo-claro-fresa))';
        var t = rows(slug, p, current.size);
        var priceTxt = ask ? 'Consultar' : cop(price);
        var addTxt = out ? 'Sin stock' : (ask ? 'Pedir' : 'Agregar al carrito');

        var is500 = current.size === '500 ml';
        var is1L = current.size === '1 Litro';

        return '' +
        '<aside class="yfm-art" style="--yfm-bg:' + bgStyle + '">' +
            '<div class="yfm-art-top"><span>Yogurt artesanal</span>' + (p.categoria ? '<span>' + esc(p.categoria) + '</span>' : '') + '</div>' +
            '<div class="yfm-stage"><span class="yfm-floor" aria-hidden="true"></span>' +
                imgTag +
            '</div>' +
            '<p class="yfm-caption">' + caption + '</p>' +
        '</aside>' +
        '<div class="yfm-body">' +
            '<div class="yfm-head">' +
                '<h2 class="yfm-title" id="yfm-title">' + esc(p.nombre) + '</h2>' +
                '<data class="yfm-price" id="yfm-price" value="' + (ask ? '' : price) + '">' +
                    (p.descuento > 0 && !ask ? '<s>' + cop(basePrice) + '</s> ' : '') + priceTxt + '</data>' +
            '</div>' +
            '<p class="yfm-lead">' + esc(lead) + '</p>' +
            '<div class="yfm-size-selector" data-yfm-sizes role="radiogroup" aria-label="Presentación">' +
                '<button type="button" class="yfm-size-pill' + (is500 ? ' is-active' : '') + '" data-yfm-size="500 ml">500 ml</button>' +
                '<button type="button" class="yfm-size-pill' + (is1L ? ' is-active' : '') + '" data-yfm-size="1 Litro">1 Litro</button>' +
            '</div>' +
            '<section class="yfm-sheet" aria-labelledby="yfm-sheet-t">' +
                '<div class="yfm-sheet-head"><h3 id="yfm-sheet-t">Ficha del producto</h3>' +
                    (t.pending ? '<span>datos en amarillo: pendientes</span>' : '') + '</div>' +
                '<dl class="yfm-rows">' + t.html + '</dl>' +
            '</section>' +
            '<div class="yfm-foot">' +
                '<div class="yfm-qty" role="group" aria-label="Cantidad">' +
                    '<button type="button" data-yfm-qty="-1" aria-label="Quitar uno">' + ICON.minus + '</button>' +
                    '<span data-yfm-qty-val aria-live="polite">1</span>' +
                    '<button type="button" data-yfm-qty="1" aria-label="Sumar uno">' + ICON.plus + '</button>' +
                '</div>' +
                '<button type="button" class="yfm-add" data-yfm-add' + (out ? ' disabled' : '') + '>' +
                    '<span class="yfm-add-l">' + ICON.cart + addTxt + '</span>' +
                    (out ? '' : '<span class="yfm-add-p" data-yfm-total>' + priceTxt + '</span>') +
                '</button>' +
                (t.pending ? '<p class="yfm-note">Los datos pendientes se llenan cuando YogurASO los confirme.</p>' : '') +
            '</div>' +
        '</div>';
    }

    var dlg = null, current = { slug: '', product: null, size: '500 ml' }, opener = null, closeTimer = 0;

    function updateModalPricing() {
        var p = productFor(current.slug, current.product);
        var price = priceForSize(p, current.size);
        var basePrice = basePriceForSize(p, current.size);
        var ask = !Number(p.precio);
        var priceEl = dlg.querySelector('#yfm-price');
        if (priceEl) {
            priceEl.innerHTML = (p.descuento > 0 && !ask ? '<s>' + cop(basePrice) + '</s> ' : '') + (ask ? 'Consultar' : cop(price));
        }
        var presEl = dlg.querySelector('.yfm-row-pres dd');
        if (presEl) presEl.textContent = 'Botella de ' + current.size;
        var tot = dlg.querySelector('[data-yfm-total]');
        if (tot && Number(p.precio)) tot.textContent = cop(price * qty());
    }

    function build() {
        dlg = document.createElement('dialog');
        dlg.className = 'yfm';
        dlg.id = 'yfm';
        dlg.setAttribute('tabindex', '-1');
        dlg.setAttribute('aria-modal', 'true');
        dlg.setAttribute('aria-labelledby', 'yfm-title');
        dlg.innerHTML = '<div class="yfm-card">' +
            '<button type="button" class="yfm-x" data-yfm-close aria-label="Cerrar ficha">' + ICON.x + '</button>' +
            '<div class="yfm-inner" data-yfm-inner></div></div>';
        document.body.appendChild(dlg);

        // Cerrar al hacer clic fuera de la tarjeta o en el botón X.
        dlg.addEventListener('click', function (e) {
            if (e.target.closest('[data-yfm-close]')) {
                e.preventDefault();
                e.stopPropagation();
                return close();
            }
            if (!e.target.closest('.yfm-card')) {
                return close();
            }
            var q = e.target.closest('[data-yfm-qty]');
            if (q) return setQty(qty() + Number(q.getAttribute('data-yfm-qty')));
            var sz = e.target.closest('[data-yfm-size]');
            if (sz) {
                var newSize = sz.getAttribute('data-yfm-size');
                if (newSize && newSize !== current.size) {
                    current.size = newSize;
                    dlg.querySelectorAll('.yfm-size-pill').forEach(function (b) {
                        b.classList.toggle('is-active', b === sz);
                    });
                    updateModalPricing();
                }
                return;
            }
            if (e.target.closest('[data-yfm-add]')) return add();
        });

        // Soporte táctil para deslizar hacia abajo (swipe-down) y cerrar la hoja en móvil/iPhone
        var touchStartY = 0;
        var touchDeltaY = 0;
        var swipingSheet = false;
        dlg.addEventListener('touchstart', function (e) {
            if (window.innerWidth > 720 || !e.touches || e.touches.length !== 1) return;
            if (e.target.closest('[data-yfm-close], button, a')) return;
            var sheet = dlg.querySelector('.yfm-sheet');
            var inHeader = !!e.target.closest('.yfm-art, .yfm-head');
            var atSheetTop = !sheet || sheet.scrollTop <= 2;
            if (!inHeader && !atSheetTop) return;
            touchStartY = e.touches[0].clientY;
            touchDeltaY = 0;
            swipingSheet = true;
        }, { passive: true });

        dlg.addEventListener('touchmove', function (e) {
            if (!swipingSheet || !e.touches || e.touches.length !== 1) return;
            var dy = e.touches[0].clientY - touchStartY;
            if (dy <= 0) {
                touchDeltaY = 0;
                return;
            }
            touchDeltaY = dy;
            var card = dlg.querySelector('.yfm-card');
            if (card && dy > 6) {
                card.style.transition = 'none';
                card.style.transform = 'translate3d(0, ' + Math.round(dy * 0.85) + 'px, 0)';
            }
        }, { passive: true });

        dlg.addEventListener('touchend', function () {
            if (!swipingSheet) return;
            swipingSheet = false;
            var card = dlg.querySelector('.yfm-card');
            if (card) {
                card.style.removeProperty('transition');
                card.style.removeProperty('transform');
            }
            if (touchDeltaY > 65) {
                close();
            }
            touchDeltaY = 0;
        }, { passive: true });
        dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); }); // Escape
        dlg.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { e.preventDefault(); close(); return; }
            if (e.key !== 'Tab') return;
            // trampa de foco ligera
            var f = Array.prototype.filter.call(dlg.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'), function (el) { return el.offsetParent !== null; });
            if (!f.length) return;
            var first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }

    function qty() { var v = dlg && dlg.querySelector('[data-yfm-qty-val]'); return v ? (Number(v.textContent) || 1) : 1; }
    function setQty(n) {
        var p = productFor(current.slug, current.product);
        var max = Number.isFinite(p.stock) && p.stock > 0 ? p.stock : 99;
        if (n > max && window.YogurUtils && window.YogurUtils.mostrarNotificacion) {
            window.YogurUtils.mostrarNotificacion('Solo hay ' + max + ' unidades disponibles en stock', 'warning');
        }
        n = Math.min(max, Math.max(1, n));
        dlg.querySelector('[data-yfm-qty-val]').textContent = String(n);
        var tot = dlg.querySelector('[data-yfm-total]');
        var price = priceForSize(p, current.size);
        if (tot && Number(p.precio)) tot.textContent = cop(price * n);
    }

    function add() {
        var p = productFor(current.slug, current.product);
        if (!window.Cart || !window.Cart.addToCart || Number(p.stock) <= 0) return;
        var is1L = current.size === '1 Litro';
        var price = priceForSize(p, current.size);
        window.Cart.addToCart({
            id: p.id,
            lineId: p.id + '::' + (is1L ? '1000' : '500'),
            nombre: p.nombre,
            tamano: current.size,
            precio: price || Number(p.precio) || 0,
            imagen_url: p.imagen_url ? asset(p.imagen_url) : asset('assets/products/yoguraso-' + current.slug + '-500ml-sm.webp'),
            stock: p.stock,
            cantidad: qty()
        });
        close();
    }

    function has(slug) { return !!flavorOf(slug); }

    /* Color fuerte elegido en el panel (color_dark o triad.dark), si es un hex válido. */
    function accentFor(slug, given) {
        var cat = window.YogCatalog && window.YogCatalog.bySlug && window.YogCatalog.bySlug[slug];
        var triad = window.YogurThemeReactor && window.YogurThemeReactor.triads && window.YogurThemeReactor.triads[slug];
        var list = [given && given.color_dark, cat && cat.color_dark, triad && triad.dark, given && given.color_acento, cat && cat.color_acento];
        for (var i = 0; i < list.length; i++) {
            if (/^#[0-9a-f]{6}$/i.test(String(list[i] || ''))) return String(list[i]);
        }
        return '';
    }

    function open(slug, from, product) {
        var safeSlug = slug || (product && product.slug) || 'fresa';
        if (!has(safeSlug) && !product) return false;
        slug = safeSlug;
        if (!dlg) build();
        clearTimeout(closeTimer);
        opener = from || document.activeElement;
        current = {
            slug: slug,
            product: product || null,
            size: (product && product.selectedSize) ? product.selectedSize : '500 ml'
        };
        try {
            if (window.YogAnalytics?.trackProductClick) {
                var pName = product?.nombre || (window.YOGUR_FLAVORS?.find(function (f) { return f.slug === slug; })?.nombre) || slug;
                window.YogAnalytics.trackProductClick(product?.id || slug, pName, 'inspect');
            }
        } catch (_) {}
        dlg.querySelector('[data-yfm-inner]').innerHTML = content(slug);
        dlg.setAttribute('data-flavor', slug);
        dlg.style.setProperty('--yfm-c', accentFor(slug, product) || 'var(--bg-' + slug + ', var(--rojo-marca))');
        var card = dlg.querySelector('.yfm-card');
        if (card) {
            card.style.removeProperty('transition');
            card.style.removeProperty('transform');
        }
        dlg.classList.remove('is-open');
        if (!dlg.open) {
            if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
        }
        dlg.scrollTop = 0;
        document.documentElement.classList.add('yfm-lock');
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                if (!dlg || !dlg.open) return;
                dlg.scrollTop = 0;
                dlg.classList.add('is-open');
            });
        });
        if (dlg && dlg.focus) {
            try { dlg.focus({ preventScroll: true }); } catch (_) {}
        }
        return true;
    }

    function close() {
        if (!dlg || !dlg.open) return;
        clearTimeout(closeTimer);
        if (opener && opener.blur) {
            try { opener.blur(); } catch (_) {}
        }
        if (document.activeElement && document.activeElement.blur) {
            try { document.activeElement.blur(); } catch (_) {}
        }
        var card = dlg.querySelector('.yfm-card');
        if (card) {
            card.style.removeProperty('transition');
            card.style.removeProperty('transform');
        }
        dlg.classList.remove('is-open');
        document.documentElement.classList.remove('yfm-lock');
        closeTimer = setTimeout(function () {
            if (dlg.close && dlg.open) dlg.close();
            dlg.removeAttribute('open');
            if (opener && opener.blur) {
                try { opener.blur(); } catch (_) {}
            }
            if (document.activeElement && document.activeElement.blur) {
                try { document.activeElement.blur(); } catch (_) {}
            }
        }, reduce.matches ? 0 : 360);
    }

    window.YogFicha = { open: open, close: close, has: has };
})();
