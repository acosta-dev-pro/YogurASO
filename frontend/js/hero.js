/**
 * hero.js — Portada YoguraSo: cambio de sabor sin selector.
 * - Lo único que cambia es el fondo (CSS, body[data-flavor]) y las botellas, que se funden en su mismo sitio.
 *   Título, subtítulo, botón, logo y menú no se mueven ni se recargan.
 * - Cambio automático cada ~5,5 s; el anillo del botón de pausa marca el tiempo (su animationend avanza).
 * - Toque o clic en las botellas = siguiente; deslizar = siguiente/anterior; flechas ← → con foco en las botellas.
 * - Se detiene solo con la pestaña oculta, el hero fuera de vista o el foco del teclado dentro de las botellas.
 * - prefers-reduced-motion: sin cambio automático (arranca en pausa) y fundidos cortos.
 * Datos de sabores: js/flavors.js · Colores: css/hero.css
 */
(function () {
    'use strict';

    var FLAVORS = window.YOGUR_FLAVORS;
    var hero = document.getElementById('hero');
    if (!FLAVORS || !FLAVORS.length || !hero) return;

    var INTERVAL = 5500;
    var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    var base = 'assets/products/yoguraso-';
    var MAIN_SIZES = '(max-width: 860px) 46vw, 23vw';
    var body = document.body;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    var stage = document.getElementById('hero-stage');
    var pauseBtn = document.getElementById('hero-pause');
    var live = document.getElementById('hero-live');
    var ring = pauseBtn && pauseBtn.querySelector('.hero-pause-progress');
    var themeMeta = document.querySelector('meta[name="theme-color"]');

    function src(slug, small) { return base + slug + '-500ml' + (small ? '-sm' : '') + '.webp'; }
    function mainSet(slug) { return src(slug, true) + ' 320w, ' + src(slug) + ' 640w'; }

    var bottleLeft = document.getElementById('bottle-left');
    var bottleMain = document.getElementById('bottle-main');
    var bottleSecond = document.getElementById('bottle-second');

    var current = 0, swapId = 0, isAnimating = false;
    var userPaused = reduce.matches, hidden = document.hidden, offscreen = false, focusHold = false;

    /* ---------- Imágenes y Precarga Inmediata ---------- */
    var cache = {};
    function load(slug, isMain) {
        var key = slug + (isMain ? ':m' : ':s');
        if (!cache[key]) {
            cache[key] = new Promise(function (resolve) {
                var im = new Image();
                if (isMain) { im.sizes = MAIN_SIZES; im.srcset = mainSet(slug); }
                im.src = src(slug, !isMain);
                if (im.decode) im.decode().then(resolve, resolve);
                else im.onload = im.onerror = resolve;
            });
        }
        return cache[key];
    }

    // Precargar inmediatamente los 8 sabores para eliminar cualquier latencia en cambios rápidos
    FLAVORS.forEach(function (f) {
        load(f.slug, true);
        load(f.slug, false);
    });

    function fillSlot(slotEl, flavor, isMain) {
        if (!slotEl || !flavor) return;
        var img = slotEl.querySelector('.bottle-img');
        var reflectImg = slotEl.querySelector('.bottle-reflect-img');
        if (img) {
            if (isMain) { img.sizes = MAIN_SIZES; img.srcset = mainSet(flavor.slug); }
            else { img.removeAttribute('sizes'); img.removeAttribute('srcset'); }
            img.src = src(flavor.slug, !isMain);
            img.alt = isMain ? flavor.alt : '';
        }
        if (reflectImg) {
            reflectImg.src = src(flavor.slug, !isMain);
        }
    }

    var activeAnims = [];
    function cancelActiveAnims() {
        while (activeAnims.length > 0) {
            var a = activeAnims.pop();
            try { a.cancel(); } catch (e) {}
        }
    }

    function anim(el, frames, opts) {
        if (!el || !el.animate) return { finished: Promise.resolve(), cancel: function () {} };
        var a = el.animate(frames, opts);
        activeAnims.push(a);
        return a;
    }

    var showcaseBottleImg = document.getElementById('showcaseBottleImg');
    var showcaseBottleReflect = document.getElementById('showcaseBottleReflect');

    function updateShowcaseFlavor(flavor) {
        if (!flavor) return;
        if (showcaseBottleImg) {
            showcaseBottleImg.src = src(flavor.slug, false);
            showcaseBottleImg.alt = 'Yogurt artesanal de ' + flavor.nombre + ', 500 ml';
        }
        if (showcaseBottleReflect) {
            showcaseBottleReflect.src = src(flavor.slug, false);
        }
        if (travelBottleImg) {
            travelBottleImg.src = src(flavor.slug, false);
        }
    }

    function setTheme(flavor) {
        body.dataset.flavor = flavor.slug;
        body.dataset.heroFg = 'light';
        if (themeMeta) {
            var c = getComputedStyle(body).getPropertyValue('--hero-bg').trim();
            if (c) themeMeta.content = c;
        }
        updateShowcaseFlavor(flavor);
        document.dispatchEvent(new CustomEvent('yg:flavorchange', { detail: { flavor: flavor } }));
    }

    var lastStepTime = 0;

    function transitionStage(fromIndex, toIndex, dir, id) {
        var fromF = FLAVORS[fromIndex];
        var toF = FLAVORS[toIndex];
        var nextF = FLAVORS[(toIndex + 1) % FLAVORS.length];
        var prevF = FLAVORS[(toIndex - 1 + FLAVORS.length) % FLAVORS.length];

        var isForward = dir >= 0;
        var fast = reduce.matches;

        // Cancelar inmediatamente cualquier animación activa previa
        cancelActiveAnims();

        if (fast) {
            fillSlot(bottleMain, toF, true);
            fillSlot(bottleSecond, nextF, false);
            isAnimating = false;
            return;
        }

        var isMobile = window.innerWidth <= 860;
        var ANIM_DURATION = 380;
        var ANIM_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

        if (isMobile) {
            fillSlot(bottleMain, fromF, true);
            if (isForward) {
                fillSlot(bottleSecond, toF, false);
                if (bottleSecond) {
                    bottleSecond.style.opacity = '1';
                    bottleSecond.style.left = '125%';
                }
                var m1 = anim(bottleMain, [
                    { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(1)', opacity: 1 },
                    { transform: 'translateX(-50%) translate3d(-50vw, 0, 0) scale(0.82)', opacity: 0 }
                ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

                var m2 = anim(bottleSecond, [
                    { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(0.82)', opacity: 0.5 },
                    { transform: 'translateX(-50%) translate3d(-75vw, 0, 0) scale(1)', opacity: 1 }
                ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

                Promise.all([m1.finished, m2.finished]).then(function () {
                    if (id !== swapId) return;
                    cancelActiveAnims();
                    fillSlot(bottleMain, toF, true);
                    fillSlot(bottleSecond, nextF, false);
                    if (bottleSecond) { bottleSecond.style.opacity = '0'; bottleSecond.style.left = '125%'; }
                    isAnimating = false;
                }).catch(function () {});
            } else {
                fillSlot(bottleLeft, toF, false);
                if (bottleLeft) {
                    bottleLeft.style.opacity = '1';
                    bottleLeft.style.left = '-25%';
                }
                var m1 = anim(bottleMain, [
                    { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(1)', opacity: 1 },
                    { transform: 'translateX(-50%) translate3d(50vw, 0, 0) scale(0.82)', opacity: 0 }
                ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

                var m2 = anim(bottleLeft, [
                    { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(0.82)', opacity: 0.5 },
                    { transform: 'translateX(-50%) translate3d(75vw, 0, 0) scale(1)', opacity: 1 }
                ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

                Promise.all([m1.finished, m2.finished]).then(function () {
                    if (id !== swapId) return;
                    cancelActiveAnims();
                    fillSlot(bottleMain, toF, true);
                    fillSlot(bottleSecond, nextF, false);
                    if (bottleLeft) { bottleLeft.style.opacity = '0'; bottleLeft.style.left = '-25%'; }
                    isAnimating = false;
                }).catch(function () {});
            }
            return;
        }

        if (isForward) {
            // El sabor saliente está en bottleMain
            fillSlot(bottleMain, fromF, true);
            // El sabor entrante (toF) SIEMPRE se ubica explícitamente en bottleSecond para entrar al centro
            fillSlot(bottleSecond, toF, false);
            // El siguiente sabor (nextF) entra por la derecha a través de bottleLeft
            fillSlot(bottleLeft, nextF, false);
            if (bottleLeft) {
                bottleLeft.style.opacity = '1';
                bottleLeft.style.left = 'clamp(740px, 88vw, 1440px)';
            }

            // 1. Botella principal sale hacia atrás a la izquierda
            var a1 = anim(bottleMain, [
                { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(1) rotate(0deg)', opacity: 1, filter: 'blur(0px)' },
                { transform: 'translateX(-50%) translate3d(-20vw, -18px, 0) scale(0.68) rotate(-4deg)', opacity: 0, filter: 'blur(2px)' }
            ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

            // 2. Botella secundaria (toF) avanza al centro y crece a protagonista
            var a2 = anim(bottleSecond, [
                { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(1) rotate(0deg)', opacity: 0.92, filter: 'blur(0px)' },
                { transform: 'translateX(-50%) translate3d(-25vw, 35px, 0) scale(1.61) rotate(0deg)', opacity: 1, filter: 'blur(0px)' }
            ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

            // 3. Nueva botella de fondo entra por la derecha
            var a3 = anim(bottleLeft, [
                { transform: 'translateX(-50%) translate3d(16vw, -15px, 0) scale(0.68) rotate(4deg)', opacity: 0, filter: 'blur(2px)' },
                { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(1) rotate(0deg)', opacity: 0.92, filter: 'blur(0px)' }
            ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

            Promise.all([a1.finished, a2.finished, a3.finished]).then(function () {
                if (id !== swapId) return;
                cancelActiveAnims();
                fillSlot(bottleMain, toF, true);
                fillSlot(bottleSecond, nextF, false);
                if (bottleLeft) {
                    bottleLeft.style.opacity = '0';
                    bottleLeft.style.left = 'clamp(260px, 36vw, 620px)';
                }
                isAnimating = false;
            }).catch(function () {});
        } else {
            // Atrás: el anterior entra desde la izquierda
            fillSlot(bottleMain, fromF, true);
            fillSlot(bottleLeft, toF, false);
            fillSlot(bottleSecond, prevF, false);
            if (bottleLeft) {
                bottleLeft.style.opacity = '1';
                bottleLeft.style.left = 'clamp(260px, 36vw, 620px)';
            }

            var b1 = anim(bottleMain, [
                { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(1) rotate(0deg)', opacity: 1, filter: 'blur(0px)' },
                { transform: 'translateX(-50%) translate3d(20vw, -18px, 0) scale(0.68) rotate(4deg)', opacity: 0, filter: 'blur(2px)' }
            ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

            var b2 = anim(bottleLeft, [
                { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(1) rotate(0deg)', opacity: 0.92, filter: 'blur(0px)' },
                { transform: 'translateX(-50%) translate3d(25vw, 35px, 0) scale(1.61) rotate(0deg)', opacity: 1, filter: 'blur(0px)' }
            ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

            var b3 = anim(bottleSecond, [
                { transform: 'translateX(-50%) translate3d(0, 0, 0) scale(1) rotate(0deg)', opacity: 0.92, filter: 'blur(0px)' },
                { transform: 'translateX(-50%) translate3d(16vw, -15px, 0) scale(0.68) rotate(4deg)', opacity: 0, filter: 'blur(2px)' }
            ], { duration: ANIM_DURATION, easing: ANIM_EASE, fill: 'forwards' });

            Promise.all([b1.finished, b2.finished, b3.finished]).then(function () {
                if (id !== swapId) return;
                cancelActiveAnims();
                fillSlot(bottleMain, toF, true);
                fillSlot(bottleSecond, nextF, false);
                if (bottleLeft) {
                    bottleLeft.style.opacity = '0';
                }
                isAnimating = false;
            }).catch(function () {});
        }
    }

    function show(i, opts) {
        var len = FLAVORS.length;
        var n = (i % len + len) % len;
        if (n === current && !(opts && opts.force)) return;
        var dir = (opts && typeof opts.dir === 'number') ? opts.dir : 1;
        var prevIndex = current;
        current = n;
        var flavor = FLAVORS[n];
        var id = ++swapId;
        isAnimating = true;

        var now = performance.now();
        var isVeryFast = (now - lastStepTime) < 140;
        lastStepTime = now;

        // El fondo y el sabor se activan al mismo milisegundo exacto
        setTheme(flavor);

        if (isVeryFast) {
            // A velocidad luz: sincronización instantánea sin colas ni desfasajes
            cancelActiveAnims();
            fillSlot(bottleMain, flavor, true);
            var nextF = FLAVORS[(n + 1) % len];
            fillSlot(bottleSecond, nextF, false);
            if (bottleLeft) {
                bottleLeft.style.opacity = '0';
                bottleLeft.style.left = 'clamp(260px, 36vw, 620px)';
            }
            isAnimating = false;
        } else {
            transitionStage(prevIndex, n, dir, id);
        }

        if (stage) stage.setAttribute('aria-label', flavor.nombre + '. Toca o usa las flechas para cambiar de sabor');
        if (live && opts && opts.announce) live.textContent = 'Sabor ' + flavor.nombre;
        restartTimer();
    }
    function step(d, announce) {
        show(current + d, { announce: announce, dir: d });
    }

    /* ---------- Cambio automático cada ~5.5s ---------- */
    var autoTimer = null;
    function held() { return userPaused || hidden || offscreen || focusHold; }
    function restartTimer() {
        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        if (held()) return;
        autoTimer = setTimeout(function () {
            if (!held()) step(1, false);
        }, INTERVAL);
    }
    function syncHold() {
        if (held()) {
            if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        } else {
            restartTimer();
        }
    }
    function setUserPaused(p) {
        userPaused = p;
        if (pauseBtn) {
            pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
            pauseBtn.setAttribute('aria-label', p ? 'Reanudar el cambio automático de sabores' : 'Pausar el cambio automático de sabores');
            if (p) pauseBtn.classList.remove('is-running', 'is-held');
        }
        if (p) {
            if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        } else {
            restartTimer();
        }
    }
    if (pauseBtn) {
        pauseBtn.style.setProperty('--hero-interval', INTERVAL + 'ms');
        pauseBtn.addEventListener('click', function () { setUserPaused(!userPaused); });
        if (ring) ring.addEventListener('animationend', function (e) {
            if (e.animationName === 'heroRing' && !held()) step(1, false);
        });
        setUserPaused(userPaused);
    } else {
        restartTimer();
    }
    document.addEventListener('visibilitychange', function () { hidden = document.hidden; syncHold(); });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            offscreen = !entries[0].isIntersecting;
            syncHold();
        }, { threshold: 0.35 }).observe(hero);
    }
    if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) setUserPaused(true); });

    /* ---------- Teclado, toque y deslizamiento ---------- */
    if (stage) {
        stage.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') step(1, true);
            else if (e.key === 'ArrowLeft') step(-1, true);
            else if (e.key === 'Home') show(0, { announce: true });
            else if (e.key === 'End') show(FLAVORS.length - 1, { announce: true });
            else return;
            e.preventDefault();
        });
        stage.addEventListener('focusin', function () { if (stage.matches(':focus-visible')) { focusHold = true; syncHold(); } });
        stage.addEventListener('focusout', function () { focusHold = false; syncHold(); });

        var x0 = null, y0 = 0, swiped = false;
        stage.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            x0 = e.clientX; y0 = e.clientY; swiped = false;
        });
        window.addEventListener('pointerup', function (e) {
            if (x0 === null) return;
            var dx = e.clientX - x0, dy = e.clientY - y0;
            x0 = null;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                swiped = true;
                step(dx < 0 ? 1 : -1, true);
            }
        });
        window.addEventListener('pointercancel', function () { x0 = null; });
        stage.addEventListener('click', function () {
            if (swiped) { swiped = false; return; }
            step(1, true);
        });
    }

    /* ---------- Sistema de Scroll & Acompañamiento del Yogurt a Sección 2 ---------- */
    var header = document.getElementById('siteHeader');
    var secShowcase = document.getElementById('nosotros');
    var showcaseRedBox = document.getElementById('showcaseRedBox');
    var showcaseBottleWrap = document.getElementById('showcaseBottleWrap');
    var showcaseShadow = showcaseBottleWrap ? showcaseBottleWrap.querySelector('.showcase-bottle-shadow') : null;

    // Crear elemento de la botella viajera fija
    var travelBottle = document.getElementById('heroTravelBottle');
    var travelBottleImg = null;
    if (!travelBottle) {
        travelBottle = document.createElement('div');
        travelBottle.id = 'heroTravelBottle';
        travelBottle.className = 'hero-travel-bottle';
        travelBottle.setAttribute('aria-hidden', 'true');
        travelBottleImg = document.createElement('img');
        travelBottleImg.alt = '';
        travelBottleImg.decoding = 'async';
        if (showcaseBottleImg) travelBottleImg.src = showcaseBottleImg.src;
        travelBottle.appendChild(travelBottleImg);
        document.body.appendChild(travelBottle);
    } else {
        travelBottleImg = travelBottle.querySelector('img');
    }

    var winHeight = window.innerHeight;
    var heroDoc = null;
    var targetDoc = null;
    var endScroll = 600;
    var prefersReduced = false;

    function measureHeroMetrics() {
        winHeight = window.innerHeight;
        prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var sY = window.scrollY || window.pageYOffset || 0;
        var sX = window.scrollX || window.pageXOffset || 0;
        var zoom = parseFloat(getComputedStyle(document.documentElement).zoom);
        if (!(zoom > 0) || !isFinite(zoom)) zoom = 1;

        var mainBottleEl = bottleMain ? bottleMain.querySelector('.bottle-img') : null;
        if (mainBottleEl) {
            // Si estaba oculto por el viaje, mostrar brevemente para medir con exactitud
            var wasHidden = mainBottleEl.style.visibility === 'hidden';
            if (wasHidden) mainBottleEl.style.visibility = '';
            var r = mainBottleEl.getBoundingClientRect();
            if (wasHidden) mainBottleEl.style.visibility = 'hidden';

            heroDoc = {
                left: r.left / zoom + sX,
                top: r.top / zoom + sY,
                width: r.width / zoom,
                height: r.height / zoom
            };
        }

        if (showcaseBottleWrap) {
            var wasWrapHidden = showcaseBottleWrap.style.visibility === 'hidden';
            if (wasWrapHidden) showcaseBottleWrap.style.visibility = '';
            var tr = showcaseBottleWrap.getBoundingClientRect();
            if (wasWrapHidden) showcaseBottleWrap.style.visibility = 'hidden';

            targetDoc = {
                left: tr.left / zoom + sX,
                top: tr.top / zoom + sY,
                width: tr.width / zoom,
                height: tr.height / zoom
            };
        }

        if (secShowcase && showcaseRedBox) {
            var secR = secShowcase.getBoundingClientRect();
            var secDocTop = secR.top / zoom + sY;
            var boxOffset = showcaseRedBox.offsetTop || 0;
            var boxH = showcaseRedBox.offsetHeight || 450;
            // Scroll exacto donde el cuadro sólido queda centrado en la ventana
            endScroll = Math.max(180, (secDocTop + boxOffset + boxH / 2) - (winHeight / 2));
        }
    }

    var ticking = false;
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(function () {
                var sY = window.scrollY || window.pageYOffset || 0;
                var sX = window.scrollX || window.pageXOffset || 0;

                // Barra sólida (header) apenas la página se mueve: cualquier scroll > 0
                // la activa y vuelve a transparente solo en el tope (scrollY 0).
                if (header) {
                    header.classList.toggle('is-stuck', sY > 0);
                }

                // Pausar carrusel del hero cuando esté fuera de pantalla
                var isOff = sY > (winHeight * 0.9);
                if (offscreen !== isOff) {
                    offscreen = isOff;
                    if (offscreen) {
                        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
                    } else {
                        restartTimer();
                    }
                }

                // Animación de viaje y aterrizaje del producto
                if (!prefersReduced && heroDoc && targetDoc && endScroll > 0) {
                    var p = Math.max(0, Math.min(1, sY / endScroll));

                    if (p <= 0.005) {
                        // 100% en el Hero
                        if (bottleMain) bottleMain.style.visibility = '';
                        if (showcaseBottleWrap) showcaseBottleWrap.style.visibility = 'hidden';
                        if (travelBottle) travelBottle.classList.remove('is-active');
                        if (showcaseShadow) showcaseShadow.style.opacity = '0';
                    } else if (p >= 0.995) {
                        // 100% aterrizado en la sección 2
                        if (bottleMain) bottleMain.style.visibility = 'hidden';
                        if (showcaseBottleWrap) {
                            showcaseBottleWrap.style.visibility = '';
                            showcaseBottleWrap.style.transform = 'translate3d(0, 0, 0)';
                            showcaseBottleWrap.style.opacity = '1';
                        }
                        if (travelBottle) travelBottle.classList.remove('is-active');
                        if (showcaseShadow) showcaseShadow.style.opacity = '1';
                    } else {
                        // Viajando con el usuario entre secciones
                        if (bottleMain) bottleMain.style.visibility = 'hidden';
                        if (showcaseBottleWrap) showcaseBottleWrap.style.visibility = 'hidden';

                        // Curva de aceleración/desaceleración suave
                        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

                        var heroCx = heroDoc.left + heroDoc.width / 2;
                        var heroCy = heroDoc.top + heroDoc.height / 2;
                        var tgtCx = targetDoc.left + targetDoc.width / 2;
                        var tgtCy = targetDoc.top + targetDoc.height / 2;
                        var curW = targetDoc.width;
                        var curH = targetDoc.height;
                        var curDocX = (heroCx + (tgtCx - heroCx) * e) - curW / 2;
                        var curDocY = (heroCy + (tgtCy - heroCy) * e) - curH / 2;

                        // Posición en pantalla (coordenadas viewport fijas)
                        var viewX = curDocX - sX;
                        var viewY = curDocY - sY;

                        // Rotación sutil y dinámica durante el vuelo (se endereza a 0° al aterrizar)
                        var tilt = Math.sin(p * Math.PI) * -5.2;

                        travelBottle.style.transform = 'translate3d(' + viewX.toFixed(1) + 'px, ' + viewY.toFixed(1) + 'px, 0) rotate(' + tilt.toFixed(2) + 'deg)';
                        travelBottle.style.width = curW.toFixed(1) + 'px';
                        travelBottle.style.height = curH.toFixed(1) + 'px';
                        travelBottle.classList.add('is-active');

                        if (showcaseShadow) {
                            showcaseShadow.style.opacity = (Math.max(0, (p - 0.75) / 0.25)).toFixed(2);
                        }
                    }
                } else if (prefersReduced) {
                    if (bottleMain) bottleMain.style.visibility = '';
                    if (showcaseBottleWrap) showcaseBottleWrap.style.visibility = '';
                    if (travelBottle) travelBottle.classList.remove('is-active');
                }

                ticking = false;
            });
            ticking = true;
        }
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            measureHeroMetrics();
            onScroll();
        }, 120);
    }, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Precarga del resto de sabores cuando el navegador está libre ---------- */
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
            load(f.slug, true).then(function () { return load(f.slug, false); }).then(function () { idle(next, 150); });
        })();
    }

    /* ---------- Arranque ---------- */
    // Enlace directo a un sabor: index.html?sabor=mora
    var start = 0;
    try {
        var q = new URLSearchParams(location.search).get('sabor');
        for (var n = 0; q && n < FLAVORS.length; n++) { if (FLAVORS[n].slug === q) { start = n; break; } }
    } catch (err) { /* sin soporte: arranca en Fresa */ }

    setTheme(FLAVORS[start]);
    if (start !== 0) {
        current = start;
        var f0 = FLAVORS[start], f1 = FLAVORS[(start + 1) % FLAVORS.length];
        fillSlot(bottleMain, f0, true);
        fillSlot(bottleSecond, f1, false);
        if (stage) stage.setAttribute('aria-label', f0.nombre + '. Toca o usa las flechas para cambiar de sabor');
    }
    requestAnimationFrame(function () {
        hero.classList.remove('is-loading');
        measureHeroMetrics();
        onScroll();
        // tras la entrada, las capas quedan libres para los fundidos
        setTimeout(function () {
            hero.classList.add('is-ready');
            measureHeroMetrics();
            onScroll();
        }, 1100);
    });
    if (document.readyState === 'complete') idle(warm, 600); else window.addEventListener('load', function () { idle(warm, 600); });
})();
