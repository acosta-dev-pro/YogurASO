/**
 * home-products-carousel.js — Aquí queda el carrusel "Nuestros yogures" del inicio.
 * Los productos vienen de main.js. Agregar usa el carrito. Clic abre la ficha.
 * Estilos: css/home-products.css
 */
import { loadCatalogProducts, matchFlavorSlug, customHex, bottleUrlFor } from './catalogo.js';
import { cardHtml, bindCardActions } from './tarjeta-yogur.js';

const root = document.querySelector('[data-hp-carousel]');
const track = root?.querySelector('.hp-track');

const AUTO_MS = 5600;
const IDLE_AFTER_TOUCH_MS = 9000;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- carrusel ---------- */
function initCarousel(products) {
    const n = products.length;
    const mod = (x, m) => ((x % m) + m) % m;
    const prevBtn = root.querySelector('[data-hp-prev]');
    const nextBtn = root.querySelector('[data-hp-next]');
    const live = root.querySelector('[data-hp-live]');

    let reps = n > 1 ? 3 : 1;
    let mid = Math.floor(reps / 2);
    let cards = [];
    let m = { first: 0, step: 1, w: 1 };
    let active = -1;
    let targetIdx = null;
    let touching = false;
    let drag = null;
    let suppressClick = false;
    let lastUserAt = 0;
    let hovering = false;
    let inView = false;

    root.classList.toggle('is-single', n < 2);

    function render() {
        let html = '';
        for (let r = 0; r < reps; r += 1) {
            html += products.map((p, i) => cardHtml(p, i, n, r !== mid)).join('');
        }
        track.innerHTML = html;
        cards = [...track.querySelectorAll('.hp-card')];
        track.querySelectorAll('.hp-card[data-clone] a, .hp-card[data-clone] button').forEach((el) => {
            el.setAttribute('tabindex', '-1');
        });
        active = -1;
    }

    function measure() {
        if (!cards.length) return;
        const a = cards[0];
        const b = cards[1] || a;
        m = {
            first: a.offsetLeft,
            w: a.offsetWidth,
            step: (b.offsetLeft - a.offsetLeft) || a.offsetWidth || 1
        };
    }

    /** Copias necesarias para que un gesto largo no llegue al borde real. */
    function isPhoneGrid() {
        return window.matchMedia('(max-width: 640px)').matches;
    }
    function neededReps() {
        if (n < 2) return 1;
        if (isPhoneGrid()) return 1;
        const setW = n * m.step;
        const side = Math.max(1, Math.ceil((track.clientWidth * 1.5) / setW));
        return Math.max(3, 2 * side + 1);
    }

    const total = () => cards.length;
    const leftFor = (idx) => m.first + idx * m.step + m.w / 2 - track.clientWidth / 2;
    let isSyncingFromExternal = false;
    let syncExternalTimer = 0;
    let isGliding = false;

    function centerIndex() {
        if (!m.step) return 0;
        const c = track.scrollLeft + track.clientWidth / 2;
        const idx = Math.round((c - m.first - m.w / 2) / m.step);
        return Math.max(0, Math.min(total() - 1, idx));
    }

    function closestPhysicalIndex(logicalIdx, fromPhysicalIdx) {
        let bestIdx = mid * n + logicalIdx;
        let bestDist = Infinity;
        for (let r = 0; r < reps; r++) {
            const candidate = r * n + logicalIdx;
            const dist = Math.abs(candidate - fromPhysicalIdx);
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx = candidate;
            }
        }
        return bestIdx;
    }

    function setActive(logical, broadcast = true) {
        const cleanLogical = mod(logical, n);
        const changedCard = (cleanLogical !== active);
        if (changedCard) {
            active = cleanLogical;
            cards.forEach((c) => c.classList.toggle('is-active', Number(c.dataset.i) === cleanLogical));
        }

        if (!broadcast || isSyncingFromExternal) return;

        // Sincronizar de inmediato el tema y color de toda la página con el producto activo
        const prod = products[cleanLogical];
        if (prod) {
            const slug = matchFlavorSlug(prod) || prod.slug || '';
            if (slug && window.YogurThemeReactor) {
                const curThemeSlug = window.YogurThemeReactor.getActiveSlug?.() || '';
                const customColors = (prod.color_dark || customHex(prod.color_fondo) || prod.imagen_url)
                    ? {
                        dark: /^#[0-9A-Fa-f]{6}$/.test(String(prod.color_dark || '').trim()) ? prod.color_dark : undefined,
                        light: customHex(prod.color_fondo) || undefined,
                        img: bottleUrlFor(prod),
                        nombre: prod.nombre
                    }
                    : null;
                if (changedCard || curThemeSlug !== slug || customColors) {
                    window.YogurThemeReactor.applyFlavorTheme(slug, 'carousel', customColors);
                }
            }
        }
    }

    function scrollToIndex(idx, smooth) {
        track.scrollTo({ left: leftFor(idx), behavior: smooth && !reduceMotion.matches ? 'smooth' : 'auto' });
    }

    function announce(logical) {
        if (live) live.textContent = `${products[logical].nombre}, ${logical + 1} de ${n}`;
    }

    function go(dir, user = true) {
        if (n < 2) return;
        if (user) lastUserAt = Date.now();
        const curPhysical = targetIdx ?? centerIndex();
        const curLogical = mod(curPhysical, n);
        const targetLogical = mod(curLogical + dir, n);

        let targetPhysical = curPhysical + dir;
        if (targetPhysical < 0 || targetPhysical >= total()) {
            const midPhysical = mid * n + curLogical;
            track.scrollLeft = leftFor(midPhysical);
            targetPhysical = midPhysical + dir;
        }

        targetIdx = targetPhysical;
        isGliding = true;
        setActive(targetLogical, true);
        scrollToIndex(targetPhysical, true);
        if (user) {
            announce(targetLogical);
        }
    }

    /* scroll: resaltar la centrada; al terminar, normalizar */
    let raf = 0;
    let settleTimer = 0;
    const hasScrollEnd = 'onscrollend' in window;
    function onSettle() {
        isGliding = false;
        const settledLogical = targetIdx !== null ? mod(targetIdx, n) : mod(centerIndex(), n);
        targetIdx = null;

        if (n > 1 && !touching && !drag && reps >= 3) {
            const midPhysical = mid * n + settledLogical;
            const targetScroll = leftFor(midPhysical);
            if (Math.abs(track.scrollLeft - targetScroll) > 2) {
                track.scrollLeft = targetScroll;
            }
        }

        if (!isSyncingFromExternal) {
            setActive(settledLogical, true);
        }
    }

    track.addEventListener('wheel', () => { lastUserAt = Date.now(); }, { passive: true });

    track.addEventListener('scroll', () => {
        if (isSyncingFromExternal) return;
        if (!isGliding && targetIdx === null) {
            if (!raf) {
                raf = requestAnimationFrame(() => {
                    raf = 0;
                    if (!isSyncingFromExternal && !isGliding && targetIdx === null) {
                        setActive(mod(centerIndex(), n), true);
                    }
                });
            }
        }
        if (!hasScrollEnd) {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(onSettle, 140);
        }
    }, { passive: true });
    if (hasScrollEnd) track.addEventListener('scrollend', onSettle);

    /* táctil: no normalizar con el dedo encima */
    track.addEventListener('touchstart', () => { touching = true; isGliding = false; targetIdx = null; lastUserAt = Date.now(); }, { passive: true });
    const touchEnd = () => {
        touching = false;
        lastUserAt = Date.now();
        if (!hasScrollEnd) { clearTimeout(settleTimer); settleTimer = setTimeout(onSettle, 200); }
    };
    track.addEventListener('touchend', touchEnd, { passive: true });
    track.addEventListener('touchcancel', touchEnd, { passive: true });

    /* arrastre con mouse (en touch/trackpad el scroll es nativo) */
    track.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0 || n < 2) return;
        lastUserAt = Date.now();
        isGliding = false;
        targetIdx = null;
        drag = { x: e.clientX, left: track.scrollLeft, moved: false, id: e.pointerId };
    });
    window.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x;
        if (!drag.moved) {
            if (Math.abs(dx) < 6) return;
            drag.moved = true;
            track.classList.add('is-dragging');
            try { track.setPointerCapture(drag.id); } catch { /* noop */ }
        }
        track.scrollLeft = drag.left - dx;
    });
    const endDrag = () => {
        if (!drag) return;
        const moved = drag.moved;
        try { track.releasePointerCapture(drag.id); } catch { /* noop */ }
        drag = null;
        if (!moved) return;
        lastUserAt = Date.now();
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 60);
        const snapTarget = centerIndex();
        const snapLogical = mod(snapTarget, n);
        targetIdx = snapTarget;
        isGliding = true;
        scrollToIndex(snapTarget, true);
        setActive(snapLogical, true);
        const restore = () => { track.classList.remove('is-dragging'); onSettle(); };
        if (hasScrollEnd) track.addEventListener('scrollend', restore, { once: true });
        setTimeout(restore, reduceMotion.matches ? 0 : 650);
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    track.addEventListener('click', (e) => {
        if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
    }, true);
    track.addEventListener('dragstart', (e) => e.preventDefault());

    /* flechas + teclado */
    prevBtn?.addEventListener('click', () => go(-1));
    nextBtn?.addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            go(e.key === 'ArrowLeft' ? -1 : 1);
        }
    });
    /* al tabular dentro de una tarjeta, centrarla */
    track.addEventListener('focusin', (e) => {
        const card = e.target.closest?.('.hp-card');
        if (!card) return;
        const idx = cards.indexOf(card);
        if (idx >= 0 && idx !== centerIndex()) scrollToIndex(idx, true);
    });

    /* botones de la tarjeta (presentación, cantidad, favorito, añadir, ficha): tarjeta-yogur.js */
    bindCardActions(track, (id) => products.find((x) => String(x.id) === id));

    /* un clic sobre una tarjeta la centra y la marca como activa */
    track.addEventListener('click', (e) => {
        const card = e.target.closest('.hp-card');
        if (!card) return;
        lastUserAt = Date.now();
        const cardLogical = mod(Number(card.dataset.i), n);
        if (cardLogical !== active) {
            const cardIdx = cards.indexOf(card);
            if (cardIdx >= 0 && !isPhoneGrid()) {
                targetIdx = cardIdx;
                isGliding = true;
                scrollToIndex(cardIdx, true);
            }
        }
        setActive(cardLogical, true);
    });

    /* auto-avance suave (opcional): se pausa con hover, foco, toque o arrastre */
    function canAuto() {
        return n > 1 && !isPhoneGrid() && inView && !hovering && !touching && !drag && !document.hidden
            && !reduceMotion.matches && !root.contains(document.activeElement)
            && Date.now() - lastUserAt > IDLE_AFTER_TOUCH_MS
            && !document.querySelector('dialog[open]');
    }
    setInterval(() => { if (canAuto()) go(1, false); }, AUTO_MS);
    root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
    root.addEventListener('pointerleave', () => { hovering = false; });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: 0.5 }).observe(track);
    }

    /* layout inicial + resize */
    function layout(logical) {
        measure();
        const need = neededReps();
        if (need !== reps) {
            reps = need;
            mid = Math.floor(reps / 2);
            render();
            measure();
        }
        scrollToIndex(mid * n + logical, false);
        setActive(logical);
    }

    render();
    const initialFlavorSlug = window.YogurThemeReactor?.getActiveSlug?.() || document.body?.dataset?.flavor || 'fresa';
    const startIdx = Math.max(0, products.findIndex((p) => (matchFlavorSlug(p) || p.slug) === initialFlavorSlug));
    layout(startIdx);

    let resizeTimer = 0;
    let lastW = track.clientWidth;
    new ResizeObserver(() => {
        if (track.clientWidth === lastW) return;
        lastW = track.clientWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => layout(active < 0 ? 0 : active), 120);
    }).observe(track);

    root.classList.add('is-ready');

    // Sincronización con el sabor seleccionado en el Hero o navegación superior
    function handleExternalFlavorSync(e) {
        if (e.detail?.source === 'carousel') return;
        const targetSlug = e.detail?.slug || e.detail?.flavor?.slug;
        if (!targetSlug || !products.length) return;
        const foundIdx = products.findIndex((p) => (matchFlavorSlug(p) || p.slug) === targetSlug);
        if (foundIdx !== -1 && foundIdx !== active) {
            isSyncingFromExternal = true;
            clearTimeout(syncExternalTimer);
            syncExternalTimer = setTimeout(() => {
                isSyncingFromExternal = false;
            }, 400);

            const currentCenter = centerIndex();
            const targetCopyIndex = closestPhysicalIndex(foundIdx, currentCenter);
            targetIdx = null;
            isGliding = false;
            scrollToIndex(targetCopyIndex, false);
            setActive(foundIdx, false);
        }
    }
    document.addEventListener('yg:flavorchange', handleExternalFlavorSync);
}

async function boot() {
    if (!root || !track) return;
    let products = [];
    try {
        products = await loadCatalogProducts();
    } catch {
        products = [];
    }
    if (!products.length) {
        track.innerHTML = '<p class="hp-status">Pronto tendremos nuevos sabores aquí.</p>';
        root.classList.add('is-single');
        return;
    }
    initCarousel(products);
}

boot();
