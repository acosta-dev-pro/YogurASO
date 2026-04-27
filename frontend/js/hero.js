/**
 * Portada: carrusel de botellas.
 * Cada botella tiene una posición en data-pos y el movimiento lo hace hero.css.
 */
(function () {
    'use strict';

    var FLAVORS = window.YOGUR_FLAVORS;
    var hero = document.getElementById('hero');
    if (!FLAVORS || !FLAVORS.length || !hero) return;

    var base = 'assets/products/yoguraso-';
    var MAIN_SIZES = '(max-width: 860px) 46vw, 23vw';
    var body = document.body;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    var stage = document.getElementById('hero-stage');
    var live = document.getElementById('hero-live');
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    var flavorEl = document.getElementById('hero-flavor');
    var flavorSr = document.getElementById('hero-flavor-sr');
    var anchor = document.getElementById('hero-anchor');
    var slotEls = [].slice.call(hero.querySelectorAll('.bottle'));

    var SLOT_COUNT = slotEls.length;
    var SLOT_LIMIT = (SLOT_COUNT - 1) / 2;

    function mod(n, m) { return ((n % m) + m) % m; }

    function hasStandardBottle(slug) {
        var triad = window.YogurThemeReactor && window.YogurThemeReactor.triads && window.YogurThemeReactor.triads[slug];
        if (triad && triad.img500 && !new RegExp('yoguraso-' + slug + '-500ml\\.webp$', 'i').test(triad.img500)) {
            return false;
        }
        return ['fresa', 'pina', 'mora', 'melocoton', 'frutos-rojos', 'cafe', 'guanabana', 'mango', 'griego'].indexOf(slug) >= 0;
    }

    function src(slug, small) {
        var triad = window.YogurThemeReactor && window.YogurThemeReactor.triads && window.YogurThemeReactor.triads[slug];
        if (triad) {
            var custom = small ? (triad.imgSm || triad.img500) : (triad.img500 || triad.imgSm);
            /* El catálogo suele apuntar a la miniatura; las botellas del hero usan la foto de 640 px si existe. */
            if (custom && !small) custom = custom.replace(/(-500ml)-sm(\.webp)$/, '$1$2');
            if (custom) return custom.replace(/^(\.\.\/)+/, '');
        }
        if (hasStandardBottle(slug)) {
            return base + slug + '-500ml' + (small ? '-sm' : '') + '.webp';
        }
        return base + 'fresa-500ml' + (small ? '-sm' : '') + '.webp';
    }

    function mainSet(slug) {
        if (!hasStandardBottle(slug)) return '';
        return src(slug, true) + ' 320w, ' + src(slug) + ' 640w';
    }

    var current = 0, currentSlug = '', mainHidden = false;

    /* ---------- Precarga y caché de imágenes (todas las botellas usan la foto de 640 px) ---------- */
    var cache = {};
    function load(slug) {
        if (!cache[slug]) {
            cache[slug] = new Promise(function (resolve) {
                var im = new Image();
                im.sizes = MAIN_SIZES;
                im.srcset = mainSet(slug);
                im.src = src(slug);
                if (im.decode) im.decode().then(resolve, resolve);
                else im.onload = im.onerror = resolve;
            });
        }
        return cache[slug];
    }

    FLAVORS.forEach(function (f) { load(f.slug); });

    /* El fondo de la portada toma el color del sabor. Es lo único que cambia de color en la web. */
    function setTheme(flavor, animate, isExternal) {
        body.dataset.flavor = flavor.slug;
        body.dataset.heroFg = 'light';
        if (!isExternal && window.YogurThemeReactor) window.YogurThemeReactor.applyFlavorTheme(flavor.slug, 'hero');
        if (themeMeta) {
            var c = getComputedStyle(body).getPropertyValue('--hero-bg').trim();
            if (c) themeMeta.content = c;
        }
    }

    /* ==========================================================================
       CARRUSEL: botellas persistentes, posiciones lógicas y transición en CSS
       ========================================================================== */
    function slotPos(el) { return parseInt(el.dataset.pos, 10); }

    function flavorAt(pos) {
        var len = FLAVORS.length;
        return FLAVORS[mod(current + pos, len)];
    }

    /* Pinta la foto de un sabor en una botella. No toca el DOM si ya tiene esa foto. */
    function paintSlot(el, flavor) {
        var img = el.querySelector('.bottle-img');
        if (!img || !flavor) return;
        var url = src(flavor.slug);
        if (img.getAttribute('src') === url) return;
        el.dataset.want = flavor.slug;
        /* Se espera a que la foto esté lista: así la botella entra ya completa, sin parpadeo ni hueco. */
        load(flavor.slug).then(function () {
            if (el.dataset.want !== flavor.slug) return;
            var set = mainSet(flavor.slug);
            if (set) { img.sizes = MAIN_SIZES; img.srcset = set; }
            else { img.removeAttribute('sizes'); img.removeAttribute('srcset'); }
            img.onerror = function () {
                this.onerror = null;
                this.removeAttribute('srcset');
                this.removeAttribute('sizes');
                this.src = base + 'fresa-500ml.webp';
            };
            img.src = url;
        });
    }

    /* Solo la botella central se anuncia a lectores de pantalla y lleva texto alternativo. */
    function syncSlotsA11y() {
        slotEls.forEach(function (el) {
            var isMain = slotPos(el) === 0;
            var img = el.querySelector('.bottle-img');
            if (isMain) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
            if (img) img.alt = isMain ? (flavorAt(0).alt || '') : '';
            el.style.visibility = (mainHidden && isMain) ? 'hidden' : '';
        });
    }

    /* Mueve una botella a otra posición; con instant=true lo hace sin transición. */
    function setPos(el, pos, instant) {
        if (instant) el.classList.add('is-jump');
        el.dataset.pos = pos;
        if (instant) {
            void el.offsetWidth;
            el.classList.remove('is-jump');
        }
    }

    /* Un paso: todas las botellas se corren una posición; la que se sale reaparece al otro lado. */
    function advance(dir) {
        slotEls.forEach(function (el) {
            var pos = slotPos(el) - dir;
            var wrapped = false;
            if (pos < -SLOT_LIMIT) { pos += SLOT_COUNT; wrapped = true; }
            else if (pos > SLOT_LIMIT) { pos -= SLOT_COUNT; wrapped = true; }
            if (wrapped) {
                paintSlot(el, flavorAt(pos));
                setPos(el, pos, true);
            } else {
                setPos(el, pos, false);
            }
        });
        syncSlotsA11y();
    }

    /* Salto largo: repinta todas las botellas y hace un fundido corto. */
    function jump() {
        slotEls.forEach(function (el) {
            paintSlot(el, flavorAt(slotPos(el)));
            if (!reduce.matches && el.animate && Math.abs(slotPos(el)) < 3) {
                el.animate([{ opacity: 0.45 }], { duration: 380, easing: 'ease-out' });
            }
        });
        syncSlotsA11y();
    }

    /* La lista de sabores puede cambiar (producto nuevo, renombrado o desactivado): el índice se re-ancla por slug. */
    function reanchorCurrent() {
        var len = FLAVORS.length;
        if (!len) return;
        if (currentSlug && (!FLAVORS[current] || FLAVORS[current].slug !== currentSlug)) {
            var found = -1;
            for (var i = 0; i < len; i++) { if (FLAVORS[i].slug === currentSlug) { found = i; break; } }
            current = found >= 0 ? found : Math.min(current, len - 1);
        }
        if (current >= len) current = len - 1;
    }

    function commitSlots() {
        reanchorCurrent();
        
        FLAVORS.forEach(function (f) { load(f.slug); });
        slotEls.forEach(function (el) { paintSlot(el, flavorAt(slotPos(el))); });
        syncSlotsA11y();
    }

    /* ---------- Nombre del sabor: cada letra entra y sale con un pequeño escalonado ---------- */
    function buildWord(text) {
        var word = document.createElement('span');
        word.className = 'hero-word';
        String(text).split('').forEach(function (ch, i) {
            var c = document.createElement('span');
            c.className = 'hero-char';
            c.style.setProperty('--i', i);
            c.textContent = ch;
            word.appendChild(c);
        });
        return word;
    }

    function setWord(text, dir, instant) {
        if (flavorSr) flavorSr.textContent = String(text).toLowerCase();
        if (!flavorEl) return;
        flavorEl.dataset.dir = dir < 0 ? '-1' : '1';
        var enter = buildWord(text);
        enter.classList.add('is-current');
        if (instant || reduce.matches) {
            flavorEl.textContent = '';
            flavorEl.appendChild(enter);
            return;
        }
        [].slice.call(flavorEl.querySelectorAll('.hero-word')).forEach(function (old) {
            if (old.classList.contains('is-exit')) { old.remove(); return; }
            old.classList.remove('is-current');
            old.classList.add('is-exit');
            setTimeout(function () { if (old.parentNode) old.remove(); }, 800);
        });
        enter.classList.add('is-enter');
        flavorEl.appendChild(enter);
    }

    /* ==========================================================================
       Cambio de sabor
       ========================================================================== */
    function show(i, opts) {
        var len = FLAVORS.length;
        if (!len) return;
        var n = mod(i, len);
        if (n === current && !(opts && opts.force)) return;
        var delta = mod(n - current, len);
        var dir = (opts && typeof opts.dir === 'number') ? opts.dir : (delta <= len / 2 ? 1 : -1);

        var prev = current;
        current = n;
        var flavor = FLAVORS[n];
        currentSlug = flavor.slug;

        if (len > 2 && delta === 1 && dir > 0) advance(1);
        else if (len > 2 && delta === len - 1 && dir < 0) advance(-1);
        else jump();

        setTheme(flavor, true, Boolean(opts && opts.fromExternal));
        setWord(flavor.nombre, dir);

        if (stage) stage.setAttribute('aria-label', flavor.nombre + '. Toca o usa las flechas para cambiar de sabor');
        if (live && opts && opts.announce) live.textContent = 'Sabor ' + flavor.nombre;
    }

    function step(d, announce) {
        show(current + d, { announce: announce, dir: d });
    }

    /* ---------- Interacciones: clics, teclado y gestos ---------- */
    function onActionKey(e) {
        if (e.target && e.target.closest && e.target.closest('button, a, input, textarea, select')) return;
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
            e.preventDefault();
            step(1, true);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            step(-1, true);
        } else if (e.key === 'Home') {
            e.preventDefault();
            show(0, { announce: true });
        } else if (e.key === 'End') {
            e.preventDefault();
            show(FLAVORS.length - 1, { announce: true });
        }
    }

    if (stage) {
        stage.addEventListener('keydown', onActionKey);

        var x0 = null, y0 = 0, swiped = false;
        stage.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            x0 = e.clientX; y0 = e.clientY; swiped = false;
        });
        window.addEventListener('pointerup', function (e) {
            if (x0 === null) return;
            var dx = e.clientX - x0, dy = e.clientY - y0;
            x0 = null;
            if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
                swiped = true;
                step(dx < 0 ? 1 : -1, true);
            }
        });
        window.addEventListener('pointercancel', function () { x0 = null; });
        /* Tocar la botella de la izquierda retrocede; cualquier otra parte avanza. */
        stage.addEventListener('click', function (e) {
            if (swiped) { swiped = false; return; }
            var bottle = e.target.closest && e.target.closest('.bottle');
            step(bottle && slotPos(bottle) < 0 ? -1 : 1, true);
        });
    }

    // Permitir Enter o Espacio para cambiar sabor mientras se visualiza el Hero
    window.addEventListener('keydown', function (e) {
        if (window.scrollY < window.innerHeight * 0.7 && (e.key === 'Enter' || e.key === ' ')) {
            if (e.target && e.target.closest && e.target.closest('button, a, input, textarea, select, dialog')) return;
            onActionKey(e);
        }
    });

    /* ---------- Precarga Idle ---------- */
    function idle(fn, ms) {
        if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 });
        else window.setTimeout(fn, ms);
    }
    function warm() {
        if (navigator.connection && navigator.connection.saveData) return;
        var order = [];
        for (var k = 1; k <= FLAVORS.length; k++) order.push(FLAVORS[(current + k) % FLAVORS.length]);
        (function next() {
            var f = order.shift();
            if (!f) return;
            load(f.slug).then(function () { idle(next, 150); });
        })();
    }

    /* ---------- Sincronización Global de Sabores ---------- */
    function setHeroFlavorBySlug(slug, fromExternal) {
        if (!slug) return;
        var s = String(slug).toLowerCase().trim();
        var idx = -1;
        for (var k = 0; k < FLAVORS.length; k++) {
            if (FLAVORS[k].slug === s) {
                idx = k;
                break;
            }
        }
        if (idx === -1) {
            var triad = window.YogurThemeReactor && window.YogurThemeReactor.triads && window.YogurThemeReactor.triads[s];
            if (triad) {
                FLAVORS.push({
                    slug: s,
                    nombre: triad.nombre || s,
                    fg: 'light',
                    alt: 'Yogurt artesanal de ' + String(triad.nombre || s).toLowerCase() + ', 500 ml',
                    img500: triad.img500,
                    imgSm: triad.imgSm
                });
                idx = FLAVORS.length - 1;
            }
        }
        if (idx === -1) { return; }
        if (idx === current) {
            /* Re-sincronizar el catálogo solo repinta las fotos que cambiaron; no mueve las botellas. */
            commitSlots();
            return;
        }
        show(idx, { fromExternal: Boolean(fromExternal) });
    }

    function onExternalFlavorChange(e) {
        var detail = e && e.detail;
        if (!detail || detail.source === 'hero') return;
        var targetSlug = detail.slug || (detail.flavor && detail.flavor.slug);
        if (targetSlug) {
            setHeroFlavorBySlug(targetSlug, true);
        }
    }
    document.addEventListener('yg:flavorchange', onExternalFlavorChange);

    window.YogurHero = {
        setFlavor: setHeroFlavorBySlug,
        show: show,
        getFlavors: function () { return FLAVORS; },
        getCurrent: function () { return FLAVORS[current]; }
    };

    /* ---------- Arranque Inicial ---------- */
    var start = 0;
    try {
        var q = new URLSearchParams(location.search).get('sabor');
        for (var n = 0; q && n < FLAVORS.length; n++) { if (FLAVORS[n].slug === q) { start = n; break; } }
    } catch (err) { /* arranque en Fresa */ }

    current = start;
    currentSlug = (FLAVORS[start] && FLAVORS[start].slug) || '';
    commitSlots();
    setWord(FLAVORS[start].nombre, 1, true);
    setTheme(FLAVORS[start], false);

    /* Respaldo: si el navegador pausa requestAnimationFrame (pestaña en segundo plano), igual se activan las transiciones. */
    setTimeout(function () { hero.classList.remove('is-loading'); }, 500);
    requestAnimationFrame(function () {
        hero.classList.remove('is-loading');
        setTimeout(function () { hero.classList.add('is-ready'); }, 800);
    });

    if (document.readyState === 'complete') idle(warm, 600); else window.addEventListener('load', function () { idle(warm, 600); });
})();
