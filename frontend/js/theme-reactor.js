/**
 * Calcula los colores de la página a partir del color oscuro de cada sabor
 * y los aplica como variables CSS.
 */
(function () {
    'use strict';

    const SESSION_FLAVOR_KEY = 'yg_active_flavor';

    /**
     * Convierte un código hexadecimal (#RRGGBB) en componentes RGB [0..255].
     */
    function hexToRgb(hex) {
        const clean = String(hex || '#A92A32').replace('#', '').trim();
        const full = clean.length === 3
            ? clean.split('').map((c) => c + c).join('')
            : clean.padEnd(6, '0').slice(0, 6);
        const num = parseInt(full, 16);
        if (Number.isNaN(num)) return { r: 169, g: 42, b: 50 };
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    /**
     * Convierte componentes RGB [0..255] a formato hexadecimal #RRGGBB.
     */
    function rgbToHex(r, g, b) {
        const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
        return '#' + [clamp(r), clamp(g), clamp(b)]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    }

    /**
     * Interpolación lineal cromática en espacio sRGB:
     * weightA = proporción de hexA (0..1), (1 - weightA) = proporción de hexB.
     */
    function mixHex(hexA, hexB, weightA) {
        const a = hexToRgb(hexA);
        const b = hexToRgb(hexB);
        const w = Math.max(0, Math.min(1, Number(weightA)));
        return rgbToHex(
            a.r * w + b.r * (1 - w),
            a.g * w + b.g * (1 - w),
            a.b * w + b.b * (1 - w)
        );
    }

    /**
     * Derivación matemática completa a partir de un único color oscuro C_dark.
     * Si se pasa un lightHex explícito, lo respeta y deriva C_wash de él;
     * de lo contrario, calcula automáticamente C_light y C_wash desde C_dark.
     */
    function derivePaletteFromDarkHex(darkHex, optionalLightHex) {
        const dark = /^#[0-9A-Fa-f]{6}$/.test(String(darkHex || '').trim())
            ? String(darkHex).trim().toUpperCase()
            : '#C3343E';
        const floor = mixHex(dark, '#000000', 0.86);
        const light = (optionalLightHex && /^#[0-9A-Fa-f]{6}$/.test(String(optionalLightHex).trim()))
            ? String(optionalLightHex).trim().toUpperCase()
            : mixHex(dark, '#FFFFFF', 0.22);
        const wash = mixHex(light, '#FFFFFF', 0.36);
        return { dark, floor, light, wash };
    }

    /**
     * Catálogo maestro de los 8 sabores oficiales de YogurASO.
     * Colores fuertes vibrantes (aptos para texto blanco) y pasteles definidos.
     */
    const FLAVOR_TRIADS = {
        fresa: {
            slug: 'fresa',
            nombre: 'Fresa',
            kicker: 'FRESA DEL HUILA · COSECHA TEMPRANA',
            img500: 'assets/products/yoguraso-fresa-500ml.webp',
            imgSm: 'assets/products/yoguraso-fresa-500ml-sm.webp',
            dark: '#C3343E',
            floor: '#A82D35',
            light: '#F4CBCF',
            wash: '#FFF5F6',
            fg: 'light'
        },
        mora: {
            slug: 'mora',
            nombre: 'Mora',
            kicker: 'MORA DE CASTILLA · COSECHA ANDINA',
            img500: 'assets/products/yoguraso-mora-500ml.webp',
            imgSm: 'assets/products/yoguraso-mora-500ml-sm.webp',
            dark: '#82366B',
            floor: '#783262',
            light: '#E6CEE3',
            wash: '#FAF5F9',
            fg: 'light'
        },
        melocoton: {
            slug: 'melocoton',
            nombre: 'Melocotón',
            kicker: 'MELOCOTÓN EN SU PUNTO · DULZOR NATURAL',
            img500: 'assets/products/yoguraso-melocoton-500ml.webp',
            imgSm: 'assets/products/yoguraso-melocoton-500ml-sm.webp',
            dark: '#DD6827',
            floor: '#CB6024',
            light: '#F7D4B4',
            wash: '#FFF6F0',
            fg: 'light'
        },
        'frutos-rojos': {
            slug: 'frutos-rojos',
            nombre: 'Frutos Rojos',
            kicker: 'FRUTOS ROJOS · MEZCLA DEL BOSQUE',
            img500: 'assets/products/yoguraso-frutos-rojos-500ml.webp',
            imgSm: 'assets/products/yoguraso-frutos-rojos-500ml-sm.webp',
            dark: '#B12C4E',
            floor: '#A32848',
            light: '#F2CBD4',
            wash: '#FDF5F7',
            fg: 'light'
        },
        cafe: {
            slug: 'cafe',
            nombre: 'Café',
            kicker: 'CAFÉ DEL HUILA · TUESTE MEDIO',
            img500: 'assets/products/yoguraso-cafe-500ml.webp',
            imgSm: 'assets/products/yoguraso-cafe-500ml-sm.webp',
            dark: '#663E31',
            floor: '#5E392D',
            light: '#E5D3C4',
            wash: '#F9F6F4',
            fg: 'light'
        },
        guanabana: {
            slug: 'guanabana',
            nombre: 'Guanábana',
            kicker: 'GUANÁBANA TROPICAL · PULPA FRESCA',
            img500: 'assets/products/yoguraso-guanabana-500ml.webp',
            imgSm: 'assets/products/yoguraso-guanabana-500ml-sm.webp',
            dark: '#488738',
            floor: '#427C34',
            light: '#D4E8C9',
            wash: '#F5FAF3',
            fg: 'light'
        },
        pina: {
            slug: 'pina',
            nombre: 'Piña',
            kicker: 'PIÑA ORO MIEL · FRESCURA TROPICAL',
            img500: 'assets/products/yoguraso-pina-500ml.webp',
            imgSm: 'assets/products/yoguraso-pina-500ml-sm.webp',
            dark: '#E4A30F',
            floor: '#D2960E',
            light: '#F5E6A6',
            wash: '#FFFDF2',
            fg: 'light'
        },
        mango: {
            slug: 'mango',
            nombre: 'Mango',
            kicker: 'MANGO TOMMY · COSECHA CÁLIDA',
            img500: 'assets/products/yoguraso-mango-500ml.webp',
            imgSm: 'assets/products/yoguraso-mango-500ml-sm.webp',
            dark: '#ED8311',
            floor: '#DA7910',
            light: '#F5DDB0',
            wash: '#FFF7ED',
            fg: 'light'
        },
        griego: {
            slug: 'griego',
            nombre: 'Griego',
            kicker: 'YOGURT GRIEGO · ARTESANAL NATURAL',
            img500: 'assets/products/yoguraso-griego-500ml.webp',
            imgSm: 'assets/products/yoguraso-griego-500ml-sm.webp',
            dark: '#1D457C',
            floor: '#15335D',
            light: '#C7DAF4',
            wash: '#F0F6FF',
            fg: 'light'
        }
    };

    const SLUG_KEYWORDS = [
        ['frutos-rojos', 'frutos-rojos'],
        ['frutos', 'frutos-rojos'],
        ['cereza', 'frutos-rojos'],
        ['fresa', 'fresa'],
        ['mora', 'mora'],
        ['melocoton', 'melocoton'],
        ['durazno', 'melocoton'],
        ['cafe', 'cafe'],
        ['guanabana', 'guanabana'],
        ['pina', 'pina'],
        ['maracuya', 'pina'],
        ['mango', 'mango'],
        ['griego', 'griego'],
        ['arequipe', 'cafe'],
        ['kumis', 'guanabana']
    ];

    /* Solo los 8 sabores oficiales (ids 1..8). "griego" y demás productos del Admin son personalizados:
       si entraran aquí se les añadiría un sufijo (griego-11) y el Hero mostraría el sabor duplicado. */
    const OFFICIAL_SLUGS = new Set(['fresa', 'pina', 'mora', 'melocoton', 'frutos-rojos', 'cafe', 'guanabana', 'mango']);
    /** Ids 1..8 de la tabla products = sabores originales; los siguientes los crea el Admin. */
    const OFFICIAL_MAX_ID = 8;
    /** Los primeros N sabores de window.YOGUR_FLAVORS son los oficiales (ver flavors.js); el resto son del Admin. */
    const OFFICIAL_COUNT = OFFICIAL_SLUGS.size;

    const SYNC_STORAGE_KEY = 'yog_products_sync_v1';

    let activeSlug = 'fresa';

    function slugifyText(input) {
        return String(input || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function resolveSlug(input) {
        if (!input) return 'fresa';
        const clean = slugifyText(input);
        if (!clean) return 'fresa';
        if (FLAVOR_TRIADS[clean]) return clean;
        for (let i = 0; i < SLUG_KEYWORDS.length; i++) {
            if (clean === SLUG_KEYWORDS[i][0] || clean === SLUG_KEYWORDS[i][1]) return SLUG_KEYWORDS[i][1];
        }
        return clean;
    }

    function isHexColor(v) {
        return /^#[0-9A-Fa-f]{6}$/.test(String(v || '').trim());
    }

    /**
     * Registra o actualiza un producto (oficial o creado en Admin) en FLAVOR_TRIADS y YOGUR_FLAVORS
     * para que toda la web (Hero, Nosotros, Proceso, Momentos, Carrusel, Catálogo y Footer)
     * sincronice sus colores e imagen de botella en tiempo real.
     */
    function registerSingleProductTheme(p) {
        if (!p) return null;
        const rawSlug = slugifyText(p.slug || p.sabor || p.nombre);
        if (!rawSlug) return null;

        const isOfficialId = p.id != null && Number(p.id) >= 1 && Number(p.id) <= OFFICIAL_MAX_ID;
        const isCustom = Boolean(p.is_custom || (p.id != null && Number(p.id) > OFFICIAL_MAX_ID));

        let targetSlug = '';
        if (isOfficialId && OFFICIAL_SLUGS.has(rawSlug)) {
            targetSlug = rawSlug;
        } else if (OFFICIAL_SLUGS.has(rawSlug) && !isCustom && p.id == null) {
            targetSlug = rawSlug;
        } else if (OFFICIAL_SLUGS.has(rawSlug)) {
            // Producto nuevo que comparte nombre con un sabor oficial: sufijo para aislarlo completamente
            targetSlug = `${rawSlug}-${p.id || Date.now().toString(36).slice(-4)}`;
        } else {
            targetSlug = rawSlug;
        }

        const existing = FLAVOR_TRIADS[targetSlug] || (OFFICIAL_SLUGS.has(rawSlug) ? FLAVOR_TRIADS[rawSlug] : null) || FLAVOR_TRIADS.fresa;
        const hasCustomDark = isHexColor(p.color_dark);
        const hasCustomLight = isHexColor(p.color_fondo) && String(p.color_fondo).toUpperCase() !== '#FFF8F4';

        let dark = hasCustomDark ? String(p.color_dark).trim().toUpperCase() : existing.dark;
        // Si solo se definió color_fondo personalizado en un producto nuevo y no color_dark, derivar un oscuro armónico
        if (!hasCustomDark && !OFFICIAL_SLUGS.has(targetSlug) && hasCustomLight) {
            dark = mixHex(p.color_fondo, '#1A080C', 0.55);
        }
        const light = hasCustomLight
            ? String(p.color_fondo).trim().toUpperCase()
            : (hasCustomDark ? derivePaletteFromDarkHex(dark).light : existing.light);
        const derived = derivePaletteFromDarkHex(dark, light);

        const customImg = String(p.imagen_url || '').trim();
        const isCustomImg = Boolean(customImg) && (
            /^(data:|blob:|https?:)/i.test(customImg) ||
            /\/storage\/v1\/object\/public\//i.test(customImg) ||
            customImg.includes('assets/')
        );

        const img500 = isCustomImg ? customImg : (existing.img500 || 'assets/products/yoguraso-fresa-500ml.webp');
        const imgSm = isCustomImg ? customImg : (existing.imgSm || 'assets/products/yoguraso-fresa-500ml-sm.webp');

        FLAVOR_TRIADS[targetSlug] = {
            slug: targetSlug,
            nombre: p.nombre || existing.nombre || targetSlug,
            kicker: existing.kicker || `${String(p.nombre || targetSlug).toUpperCase()} · ELABORADO A DIARIO`,
            img500: img500,
            imgSm: imgSm,
            dark: derived.dark,
            floor: derived.floor,
            light: derived.light,
            wash: derived.wash,
            fg: 'light'
        };

        // Inyectar las variables CSS del slug en :root para que var(--bg-<slug>) y var(--fondo-claro-<slug>) existan siempre
        const root = document.documentElement;
        if (root) {
            root.style.setProperty(`--bg-${targetSlug}`, derived.dark);
            root.style.setProperty(`--fondo-claro-${targetSlug}`, derived.light);
        }

        // Mantener window.YOGUR_FLAVORS sincronizado para Hero y Ficha
        if (Array.isArray(window.YOGUR_FLAVORS)) {
            const list = window.YOGUR_FLAVORS;
            const pid = (p.id != null && !isOfficialId) ? String(p.id) : '';

            // Un producto personalizado ocupa UNA sola posición: si cambió de slug (renombrado o
            // sufijo de colisión) se elimina la entrada anterior con su mismo id para no duplicarlo.
            if (pid) {
                for (let i = list.length - 1; i >= OFFICIAL_COUNT; i--) {
                    if (list[i].pid === pid && list[i].slug !== targetSlug) {
                        list.splice(i, 1);
                    }
                }
            }
            // Producto desactivado: sale del Hero.
            if (p.activo === false) {
                const off = list.findIndex((f, i) => i >= OFFICIAL_COUNT && f.slug === targetSlug);
                if (off >= 0) list.splice(off, 1);
            }

            const idx = list.findIndex((f) => f.slug === targetSlug);
            const flavorEntry = {
                slug: targetSlug,
                nombre: p.nombre || existing.nombre || targetSlug,
                fg: 'light',
                alt: `Yogurt artesanal de ${String(p.nombre || targetSlug).toLowerCase()}, 500 ml`,
                img500: img500,
                imgSm: imgSm,
                dark: derived.dark,
                light: derived.light,
                pid: pid
            };
            if (idx >= 0 && (isOfficialId || idx >= OFFICIAL_COUNT)) {
                list[idx] = Object.assign({}, list[idx], flavorEntry);
            } else if (idx === -1 && p.activo !== false) {
                list.push(flavorEntry);
            } else {
            }
        }

        return FLAVOR_TRIADS[targetSlug];
    }

    function registerProductThemes(products) {
        if (!Array.isArray(products)) return;
        products.forEach((p) => registerSingleProductTheme(p));
        // Si el sabor activo fue actualizado, refrescar el tema de inmediato
        if (activeSlug && FLAVOR_TRIADS[activeSlug]) {
            applyFlavorTheme(activeSlug, 'catalog-sync');
        }
    }

    function syncFromLocalStorage() {
        try {
            const raw = JSON.parse(localStorage.getItem(SYNC_STORAGE_KEY) || 'null');
            if (!raw || typeof raw !== 'object') return;
            // 1. Aplicar overrides por ID o nombre sobre los sabores base
            const idToSlug = {
                '1': 'fresa', '2': 'pina', '3': 'mora', '4': 'melocoton',
                '5': 'frutos-rojos', '6': 'mango', '7': 'cafe', '8': 'guanabana', '11': 'griego'
            };
            if (raw.overrides && typeof raw.overrides === 'object') {
                Object.keys(raw.overrides).forEach((id) => {
                    const ov = raw.overrides[id];
                    if (!ov) return;
                    const officialSlug = idToSlug[String(id)];
                    const slug = officialSlug || ov.slug || (ov.nombre ? slugifyText(ov.nombre) : '');
                    if (slug) {
                        registerSingleProductTheme(Object.assign({ id, slug }, ov));
                    }
                });
            }
            // 2. Registrar productos nuevos creados en Admin
            if (Array.isArray(raw.created)) {
                raw.created.forEach((p) => {
                    if (p && p.activo !== false) registerSingleProductTheme(p);
                });
            }
        } catch (_e) { /* ignore */ }
    }

    function getTriad(slugOrName, customColors) {
        const rawSlug = slugifyText(slugOrName);
        if (customColors && (isHexColor(customColors.dark) || isHexColor(customColors.light))) {
            const targetSlug = FLAVOR_TRIADS[rawSlug] ? rawSlug : resolveSlug(slugOrName);
            const base = FLAVOR_TRIADS[targetSlug] || FLAVOR_TRIADS.fresa;
            const dark = isHexColor(customColors.dark) ? customColors.dark : base.dark;
            const light = isHexColor(customColors.light) ? customColors.light : base.light;
            const derived = derivePaletteFromDarkHex(dark, light);
            return Object.assign({}, base, derived, {
                slug: rawSlug || base.slug,
                nombre: customColors.nombre || base.nombre,
                img500: customColors.img || base.img500,
                imgSm: customColors.img || base.imgSm
            });
        }
        const slug = FLAVOR_TRIADS[rawSlug] ? rawSlug : resolveSlug(slugOrName);
        const base = FLAVOR_TRIADS[slug] || FLAVOR_TRIADS.fresa;
        const derived = derivePaletteFromDarkHex(base.dark, base.light);
        return Object.assign({}, base, {
            floor: base.floor || derived.floor,
            wash: base.wash || derived.wash
        });
    }

    /** Colores de toda la web: siempre los de la fresa. Solo la portada cambia con el sabor. */
    function paintPage(page) {
        const root = document.documentElement;
        const body = document.body;
        const vars = {
            '--flavor-dark': page.dark, '--flavor-floor': page.floor, '--flavor-light': page.light, '--flavor-wash': page.wash,
            '--brand-red': page.dark, '--brand-red-deep': page.floor,
            '--rojo-marca': page.dark, '--rojo-marca-hover': page.floor, '--rojo-marca-deep': page.floor,
            '--brand-pink': page.light, '--brand-pink-soft': page.wash, '--brand-blush': page.wash,
            '--cream': page.wash, '--surface': page.wash, '--surface-soft': page.light, '--ysf-bg': page.dark
        };
        Object.keys(vars).forEach((k) => root.style.setProperty(k, vars[k]));
        if (body && !body.classList.contains('admin-page')) body.style.backgroundColor = page.wash;
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', page.dark);
    }

    /** Solo la portada toma el color del sabor activo. */
    function paintHero(triad) {
        if (document.body) {
            document.body.dataset.flavor = triad.slug;
            document.body.dataset.heroFg = triad.fg;
        }
        const ola = document.querySelector('.hero-wave-bottom');   // la ola de abajo es parte de la portada
        if (ola) ola.style.setProperty('--hero-bg', triad.dark);
        const hero = document.getElementById('hero');
        if (!hero) return;
        hero.style.setProperty('--hero-bg', triad.dark);
        hero.style.setProperty('--hero-floor', triad.floor);
        hero.style.setProperty('--hero-ink', triad.floor);
        hero.dataset.flavor = triad.slug;
    }

    /**
     * Aplica el sabor: la portada cambia de color; el resto de la web se queda en fresa.
     * Las tarjetas del catálogo ya no recolorean nada (source 'carousel' y 'catalog').
     */
    function applyFlavorTheme(slugOrName, source = 'reactor', customColors = null) {
        const triad = getTriad(slugOrName, customColors);
        if (source === 'carousel' || source === 'catalog') return triad;
        activeSlug = triad.slug;
        try { sessionStorage.setItem(SESSION_FLAVOR_KEY, triad.slug); } catch (_e) { /* sessionStorage bloqueado */ }
        paintPage(getTriad('fresa'));
        paintHero(triad);
        document.dispatchEvent(new CustomEvent('yg:flavorchange', {
            bubbles: true,
            detail: { slug: triad.slug, flavor: triad, triad: triad, source: source }
        }));
        return triad;
    }

    // Sincronizar con el almacenamiento local al cargar y cuando cambie en otra pestaña o en el mismo documento
    syncFromLocalStorage();
    window.addEventListener('yog:catalog-updated', () => {
        syncFromLocalStorage();
        if (activeSlug) applyFlavorTheme(activeSlug, 'storage-sync');
    });
    window.addEventListener('storage', (e) => {
        if (e.key === SYNC_STORAGE_KEY) {
            syncFromLocalStorage();
            if (activeSlug) applyFlavorTheme(activeSlug, 'storage-sync');
        }
    });

    // API pública global
    window.YogurThemeReactor = {
        triads: FLAVOR_TRIADS,
        resolveSlug: resolveSlug,
        getTriad: getTriad,
        derivePaletteFromDarkHex: derivePaletteFromDarkHex,
        mixHex: mixHex,
        applyFlavorTheme: applyFlavorTheme,
        registerProductThemes: registerProductThemes,
        registerSingleProductTheme: registerSingleProductTheme,
        getActiveSlug: () => activeSlug
    };

    // Inicializar al cargar con el sabor guardado en sesión o el atributo del body
    function initThemeReactor() {
        syncFromLocalStorage();
        let initial = document.body?.dataset?.flavor || 'fresa';
        try {
            const saved = sessionStorage.getItem(SESSION_FLAVOR_KEY);
            if (saved && FLAVOR_TRIADS[saved]) initial = saved;
        } catch (_e) { /* ignore */ }
        applyFlavorTheme(initial, 'init');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeReactor, { once: true });
    } else {
        initThemeReactor();
    }
})();
