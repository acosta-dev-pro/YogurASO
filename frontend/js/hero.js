/**
 * hero.js — Aquí queda el carrusel grande de la portada.
 * Cambian el fondo y las botellas. El texto no se mueve.
 * Sabores: js/flavors.js. Colores: css/hero.css.
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
        var bSrc = src(flavor.slug, false);
        var bAlt = 'Yogurt artesanal de ' + flavor.nombre + ', 500 ml';
        if (showcaseBottleImg) {
            showcaseBottleImg.src = bSrc;
            showcaseBottleImg.alt = bAlt;
        }
        if (showcaseBottleReflect) {
            showcaseBottleReflect.src = bSrc;
        }
        if (travelBottleImg) {
            travelBottleImg.src = bSrc;
        }
        if (!procesoBottleImg) procesoBottleImg = document.getElementById('procesoBottleImg');
        if (procesoBottleImg) {
            procesoBottleImg.src = bSrc;
            procesoBottleImg.alt = bAlt;
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
            var slide = 140;
            function restMobile() {
                if (bottleMain) { bottleMain.style.left = '50%'; bottleMain.style.opacity = '1'; bottleMain.style.zIndex = ''; }
                if (bottleSecond) { bottleSecond.style.opacity = '0'; bottleSecond.style.left = '130%'; bottleSecond.style.zIndex = ''; }
                if (bottleLeft) { bottleLeft.style.opacity = '0'; bottleLeft.style.left = '-30%'; bottleLeft.style.zIndex = ''; }
            }
            function finishMobile() {
                if (id !== swapId) return;
                cancelActiveAnims();
                fillSlot(bottleMain, toF, true);
                fillSlot(bottleSecond, nextF, false);
                restMobile();
                isAnimating = false;
            }
            var settled = false;
            function once() { if (settled) return; settled = true; finishMobile(); }
            fillSlot(bottleMain, fromF, true);
            var outgoing;
            var incoming;
            if (isForward) {
                fillSlot(bottleSecond, toF, false);
                if (bottleSecond) { bottleSecond.style.opacity = '1'; bottleSecond.style.left = '50%'; bottleSecond.style.zIndex = '6'; }
                outgoing = anim(bottleMain, [
                    { transform: 'translateX(-50%) translate3d(0, 0, 0)', opacity: 1 },
                    { transform: 'translateX(-50%) translate3d(-' + slide + 'px, 0, 0)', opacity: 0 }
                ], { duration: slide, easing: ANIM_EASE, fill: 'forwards' });
                incoming = anim(bottleSecond, [
                    { transform: 'translateX(-50%) translate3d(' + slide + 'px, 0, 0)', opacity: 1 },
                    { transform: 'translateX(-50%) translate3d(0, 0, 0)', opacity: 1 }
                ], { duration: slide, easing: ANIM_EASE, fill: 'forwards' });
            } else {
                fillSlot(bottleLeft, toF, false);
                if (bottleLeft) { bottleLeft.style.opacity = '1'; bottleLeft.style.left = '50%'; bottleLeft.style.zIndex = '6'; }
                outgoing = anim(bottleMain, [
                    { transform: 'translateX(-50%) translate3d(0, 0, 0)', opacity: 1 },
                    { transform: 'translateX(-50%) translate3d(' + slide + 'px, 0, 0)', opacity: 0 }
                ], { duration: slide, easing: ANIM_EASE, fill: 'forwards' });
                incoming = anim(bottleLeft, [
                    { transform: 'translateX(-50%) translate3d(-' + slide + 'px, 0, 0)', opacity: 1 },
                    { transform: 'translateX(-50%) translate3d(0, 0, 0)', opacity: 1 }
                ], { duration: slide, easing: ANIM_EASE, fill: 'forwards' });
            }
            Promise.all([outgoing.finished, incoming.finished]).then(once).catch(once);
            window.setTimeout(once, slide + 80);
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

    /* ---------- Sistema de Scroll & Acompañamiento del Yogurt a Sección 2 y Sección 3 ---------- */
    var header = document.getElementById('siteHeader');
    var secShowcase = document.getElementById('nosotros');
    var showcaseRedBox = document.getElementById('showcaseRedBox');
    var showcaseBottleWrap = document.getElementById('showcaseBottleWrap');
    var showcaseShadow = showcaseBottleWrap ? showcaseBottleWrap.querySelector('.showcase-bottle-shadow') : null;

    var secProceso = document.getElementById('proceso');
    var procesoBottleWrap = document.getElementById('procesoBottleWrap');
    var procesoBottleImg = document.getElementById('procesoBottleImg');
    var procesoCard = secProceso ? secProceso.querySelector('.p3d__card') : null;

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
    var procesoDoc = null;
    var endScroll = 600;
    var endScroll2 = 1200;
    var prefersReduced = false;
    var pageZoom = 1;

    function measureHeroMetrics() {
        winHeight = window.innerHeight;
        prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var sY = window.scrollY || window.pageYOffset || 0;
        var sX = window.scrollX || window.pageXOffset || 0;
        var zoom = parseFloat(getComputedStyle(document.documentElement).zoom);
        if (!(zoom > 0) || !isFinite(zoom)) zoom = 1;
        pageZoom = zoom;

        // Elementos que podrían no haber sido capturados al inicio
        if (!secProceso) secProceso = document.getElementById('proceso');
        if (!procesoBottleWrap) procesoBottleWrap = document.getElementById('procesoBottleWrap');
        if (!procesoBottleImg) procesoBottleImg = document.getElementById('procesoBottleImg');
        if (!procesoCard && secProceso) procesoCard = secProceso.querySelector('.p3d__card');

        var mainBottleEl = bottleMain ? bottleMain.querySelector('.bottle-img') : null;
        if (mainBottleEl) {
            var wasHidden = mainBottleEl.style.visibility === 'hidden';
            if (wasHidden) mainBottleEl.style.visibility = '';
            var r = mainBottleEl.getBoundingClientRect();
            if (wasHidden) mainBottleEl.style.visibility = 'hidden';

            heroDoc = {
                left: r.left + sX,
                top: r.top + sY,
                width: r.width,
                height: r.height
            };
        }

        if (showcaseBottleWrap) {
            var wasWrapHidden = showcaseBottleWrap.style.visibility === 'hidden';
            if (wasWrapHidden) showcaseBottleWrap.style.visibility = '';
            var tr = showcaseBottleWrap.getBoundingClientRect();
            if (wasWrapHidden) showcaseBottleWrap.style.visibility = 'hidden';

            targetDoc = {
                left: tr.left + sX,
                top: tr.top + sY,
                width: tr.width,
                height: tr.height
            };
        }

        if (procesoBottleWrap) {
            var wasProcHidden = procesoBottleWrap.style.visibility === 'hidden';
            if (wasProcHidden) procesoBottleWrap.style.visibility = '';
            var pr = procesoBottleWrap.getBoundingClientRect();
            if (wasProcHidden) procesoBottleWrap.style.visibility = 'hidden';

            procesoDoc = {
                left: pr.left + sX,
                top: pr.top + sY,
                width: pr.width,
                height: pr.height
            };
        }

        if (secShowcase && showcaseRedBox) {
            var secR = secShowcase.getBoundingClientRect();
            var secDocTop = secR.top + sY;
            var boxOffset = showcaseRedBox.offsetTop || 0;
            var boxH = showcaseRedBox.offsetHeight || 450;
            endScroll = Math.max(180, (secDocTop + (boxOffset + boxH / 2) * zoom) - (winHeight / 2));
        }

        if (secProceso && procesoCard) {
            var procR = secProceso.getBoundingClientRect();
            var procDocTop = procR.top + sY;
            var cardOffset = procesoCard.offsetTop || 0;
            var cardH = procesoCard.offsetHeight || 300;
            endScroll2 = Math.max(endScroll + 350, (procDocTop + (cardOffset + cardH / 2) * zoom) - (winHeight / 2));
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
                var isOff = sY > 0;
                if (offscreen !== isOff) {
                    offscreen = isOff;
                    if (offscreen) {
                        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
                    } else {
                        restartTimer();
                    }
                }

                // Animación de viaje y aterrizaje del producto (Etapa 1: Hero -> Nosotros; Etapa 2: Nosotros -> Proceso)
                if (!prefersReduced && heroDoc && targetDoc && endScroll > 0) {
                    var startScroll2 = endScroll + Math.min(160, Math.max(70, (endScroll2 - endScroll) * 0.20));
                    if (startScroll2 >= endScroll2 - 60) {
                        startScroll2 = endScroll + (endScroll2 - endScroll) * 0.18;
                    }

                    if (sY <= 2) {
                        // 100% en el Hero
                        if (bottleMain) bottleMain.style.visibility = '';
                        if (showcaseBottleWrap) showcaseBottleWrap.style.visibility = 'hidden';
                        if (procesoBottleWrap) procesoBottleWrap.style.visibility = 'hidden';
                        if (travelBottle) travelBottle.classList.remove('is-active');
                        if (showcaseShadow) showcaseShadow.style.opacity = '0';
                    } else if (sY < endScroll) {
                        // Vuelo Etapa 1: de Hero hacia Nosotros
                        var p1 = Math.max(0, Math.min(1, sY / endScroll));
                        if (bottleMain) bottleMain.style.visibility = 'hidden';
                        if (showcaseBottleWrap) showcaseBottleWrap.style.visibility = 'hidden';
                        if (procesoBottleWrap) procesoBottleWrap.style.visibility = 'hidden';

                        var heroCx = heroDoc.left + heroDoc.width / 2;
                        var heroCy = heroDoc.top + heroDoc.height / 2;
                        var tgtCx = targetDoc.left + targetDoc.width / 2;
                        var tgtCy = targetDoc.top + targetDoc.height / 2;
                        var curW = targetDoc.width;
                        var curH = targetDoc.height;
                        var cx = heroCx + (tgtCx - heroCx) * p1;
                        var cy = heroCy + (tgtCy - heroCy) * p1;
                        var s0 = targetDoc.height > 0 ? heroDoc.height / targetDoc.height : 1;
                        var sc = s0 + (1 - s0) * p1;
                        var tilt = Math.sin(p1 * Math.PI) * -5.2;

                        var viewX = (cx - curW / 2 - sX) / pageZoom;
                        var viewY = (cy - curH / 2 - sY) / pageZoom;

                        var cssW = curW / pageZoom, cssH = curH / pageZoom;
                        if (travelBottle.dataset.w !== cssW.toFixed(1)) {
                            travelBottle.style.width = cssW.toFixed(1) + 'px';
                            travelBottle.style.height = cssH.toFixed(1) + 'px';
                            travelBottle.style.transformOrigin = '50% 50%';
                            travelBottle.dataset.w = cssW.toFixed(1);
                        }
                        travelBottle.style.transform = 'translate3d(' + viewX.toFixed(2) + 'px, ' + viewY.toFixed(2) + 'px, 0) rotate(' + tilt.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
                        travelBottle.classList.add('is-active');

                        if (showcaseShadow) {
                            showcaseShadow.style.opacity = (Math.max(0, (p1 - 0.75) / 0.25)).toFixed(2);
                        }
                    } else if (sY >= endScroll && sY <= startScroll2) {
                        // 100% descansando en Nosotros
                        if (bottleMain) bottleMain.style.visibility = 'hidden';
                        if (showcaseBottleWrap) {
                            showcaseBottleWrap.style.visibility = '';
                            showcaseBottleWrap.style.transform = 'translate3d(0, 0, 0)';
                            showcaseBottleWrap.style.opacity = '1';
                        }
                        if (procesoBottleWrap) procesoBottleWrap.style.visibility = 'hidden';
                        if (travelBottle) travelBottle.classList.remove('is-active');
                        if (showcaseShadow) showcaseShadow.style.opacity = '1';
                    } else if (sY > startScroll2 && sY < endScroll2) {
                        // Vuelo Etapa 2: de Nosotros hacia Proceso
                        var p2 = Math.max(0, Math.min(1, (sY - startScroll2) / (endScroll2 - startScroll2)));
                        if (bottleMain) bottleMain.style.visibility = 'hidden';
                        if (showcaseBottleWrap) showcaseBottleWrap.style.visibility = 'hidden';
                        if (procesoBottleWrap) procesoBottleWrap.style.visibility = 'hidden';
                        if (showcaseShadow) showcaseShadow.style.opacity = (Math.max(0, 1 - p2 * 3)).toFixed(2);

                        if (procesoDoc) {
                            var nosCx = targetDoc.left + targetDoc.width / 2;
                            var nosCy = targetDoc.top + targetDoc.height / 2;
                            var procCx = procesoDoc.left + procesoDoc.width / 2;
                            var procCy = procesoDoc.top + procesoDoc.height / 2;
                            var curW2 = procesoDoc.width;
                            var curH2 = procesoDoc.height;
                            var cx2 = nosCx + (procCx - nosCx) * p2;
                            var cy2 = nosCy + (procCy - nosCy) * p2;
                            var s1to2 = procesoDoc.height > 0 ? targetDoc.height / procesoDoc.height : 1;
                            var sc2 = s1to2 + (1 - s1to2) * p2;
                            var tilt2 = Math.sin(p2 * Math.PI) * 4.5;

                            var viewX2 = (cx2 - curW2 / 2 - sX) / pageZoom;
                            var viewY2 = (cy2 - curH2 / 2 - sY) / pageZoom;

                            var cssW2 = curW2 / pageZoom, cssH2 = curH2 / pageZoom;
                            if (travelBottle.dataset.w !== cssW2.toFixed(1)) {
                                travelBottle.style.width = cssW2.toFixed(1) + 'px';
                                travelBottle.style.height = cssH2.toFixed(1) + 'px';
                                travelBottle.style.transformOrigin = '50% 50%';
                                travelBottle.dataset.w = cssW2.toFixed(1);
                            }
                            travelBottle.style.transform = 'translate3d(' + viewX2.toFixed(2) + 'px, ' + viewY2.toFixed(2) + 'px, 0) rotate(' + tilt2.toFixed(2) + 'deg) scale(' + sc2.toFixed(4) + ')';
                            travelBottle.classList.add('is-active');
                        }
                    } else {
                        // sY >= endScroll2: 100% aterrizado en Proceso
                        if (bottleMain) bottleMain.style.visibility = 'hidden';
                        if (showcaseBottleWrap) showcaseBottleWrap.style.visibility = 'hidden';
                        if (showcaseShadow) showcaseShadow.style.opacity = '0';
                        if (procesoBottleWrap) {
                            procesoBottleWrap.style.visibility = '';
                            procesoBottleWrap.style.transform = 'translate3d(0, 0, 0)';
                            procesoBottleWrap.style.opacity = '1';
                            if (!procesoBottleImg) procesoBottleImg = document.getElementById('procesoBottleImg');
                            if (procesoBottleImg && FLAVORS[current]) {
                                procesoBottleImg.src = src(FLAVORS[current].slug, false);
                                procesoBottleImg.alt = 'Yogurt artesanal de ' + FLAVORS[current].nombre + ', 500 ml';
                            }
                        }
                        if (travelBottle) travelBottle.classList.remove('is-active');
                    }
                } else if (prefersReduced) {
                    if (bottleMain) bottleMain.style.visibility = '';
                    if (showcaseBottleWrap) showcaseBottleWrap.style.visibility = '';
                    if (procesoBottleWrap) procesoBottleWrap.style.visibility = '';
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
