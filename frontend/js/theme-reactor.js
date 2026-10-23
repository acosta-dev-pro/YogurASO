/**
 * theme-reactor.js — Motor de colorimetría dinámico arraigado a dos variables centrales:
 * --flavor-dark: Color fuerte/oscuro del sabor (acento, títulos, botones)
 * --flavor-light: Color pastel/claro del sabor (tarjeta cremoso, kickers, tintes)
 */
(function () {
    'use strict';

    const FLAVOR_THEMES = {
        'fresa': {
            slug: 'fresa',
            nombre: 'Fresa',
            dark: '#C3343E',
            light: '#F4CBCF',
            wash: '#FFF5F6',
            handImg: 'assets/marketing/mano-botella-fresa-cutout.webp'
        },
        'melocoton': {
            slug: 'melocoton',
            nombre: 'Melocotón',
            dark: '#DD6827',
            light: '#F7D4B4',
            wash: '#FFF6F0',
            handImg: 'assets/marketing/mano-botella-melocoton-cutout.png'
        },
        'pina': {
            slug: 'pina',
            nombre: 'Piña',
            dark: '#E4A30F',
            light: '#F5E6A6',
            wash: '#FFFDF2',
            handImg: 'assets/marketing/mano-botella-pina-cutout.png'
        },
        'mora': {
            slug: 'mora',
            nombre: 'Mora',
            dark: '#82366B',
            light: '#E6CEE3',
            wash: '#FAF5F9',
            handImg: 'assets/marketing/mano-botella-mora-cutout.png'
        },
        'guanabana': {
            slug: 'guanabana',
            nombre: 'Guanábana',
            dark: '#488738',
            light: '#D4E8C9',
            wash: '#F5FAF3',
            handImg: 'assets/marketing/mano-botella-guanabana-cutout.png'
        },
        'mango': {
            slug: 'mango',
            nombre: 'Mango',
            dark: '#ED8311',
            light: '#F5DDB0',
            wash: '#FFF7ED',
            handImg: 'assets/marketing/mano-botella-mango-cutout.png'
        },
        'cafe': {
            slug: 'cafe',
            nombre: 'Café',
            dark: '#663E31',
            light: '#E5D3C4',
            wash: '#F9F6F4',
            handImg: 'assets/marketing/mano-botella-cafe-cutout.png'
        },
        'frutos-rojos': {
            slug: 'frutos-rojos',
            nombre: 'Frutos Rojos',
            dark: '#B12C4E',
            light: '#F2CBD4',
            wash: '#FDF5F7',
            handImg: 'assets/marketing/mano-botella-frutos-rojos-cutout.png'
        }
    };

    let currentSlug = '';
    let isBroadcasting = false;

    function applyFlavorTheme(slug, source = 'hero') {
        if (!slug) return;
        const s = String(slug).toLowerCase().trim();
        const theme = FLAVOR_THEMES[s] || FLAVOR_THEMES['fresa'];
        if (currentSlug === s && !source) return;
        currentSlug = s;

        const root = document.documentElement;
        // 1. Inyectar las dos variables centrales en :root
        root.style.setProperty('--flavor-dark', theme.dark);
        root.style.setProperty('--flavor-light', theme.light);

        // Variables de compatibilidad
        root.style.setProperty('--flavor-accent', theme.dark);
        root.style.setProperty('--flavor-hero-bg', theme.dark);
        root.style.setProperty('--flavor-card-tint', theme.light);
        root.style.setProperty('--flavor-wash', theme.wash);
        document.body.dataset.flavor = s;

        // 2. Actualizar imagen de la mano en "Llévalo contigo"
        const handImg = document.querySelector('.ytrio__hand');
        if (handImg) {
            handImg.classList.add('is-swapping');
            setTimeout(() => {
                handImg.src = theme.handImg;
                handImg.classList.remove('is-swapping');
            }, 180);
        }

        // 3. Actualizar botella en tarjeta "Propósito"
        const propositoBottle = document.querySelector('.ytrio__bottle');
        if (propositoBottle) {
            propositoBottle.src = `assets/products/yoguraso-${s}-500ml.webp`;
        }

        // 4. Actualizar botella en "Proceso 3D"
        const procesoBottle = document.getElementById('procesoBottleImg');
        if (procesoBottle) {
            procesoBottle.src = `assets/products/yoguraso-${s}-500ml.webp`;
        }

        // 5. Actualizar botella en "Sobre nosotros"
        const showcaseBottle = document.getElementById('showcaseBottleImg');
        if (showcaseBottle) {
            showcaseBottle.src = `assets/products/yoguraso-${s}-500ml.webp`;
        }

        // 6. Actualizar botella viajera en vuelo
        const travelBottleImg = document.querySelector('#heroTravelBottle img');
        if (travelBottleImg) {
            travelBottleImg.src = `assets/products/yoguraso-${s}-500ml.webp`;
        }

        // 5. Notificar bidireccionalmente
        if (!isBroadcasting) {
            isBroadcasting = true;
            try {
                document.dispatchEvent(new CustomEvent('yg:flavorchange', {
                    detail: { flavor: theme, slug: s, source: source }
                }));
            } finally {
                setTimeout(() => { isBroadcasting = false; }, 60);
            }
        }
    }

    // Escuchar cambios de sabor desde el Hero
    document.addEventListener('yg:flavorchange', (e) => {
        const detail = e.detail;
        if (!detail) return;
        const slug = detail.slug || (detail.flavor && detail.flavor.slug);
        if (slug && slug !== currentSlug && detail.source !== 'reactor') {
            applyFlavorTheme(slug, detail.source || 'hero');
        }
    });

    // Exponer API global
    window.YogurThemeReactor = {
        applyFlavorTheme,
        getFlavorTheme: (s) => FLAVOR_THEMES[s] || FLAVOR_THEMES['fresa'],
        getCurrentFlavor: () => currentSlug || 'fresa'
    };

    // Inicializar al cargar
    document.addEventListener('DOMContentLoaded', () => {
        const initialSlug = document.body.dataset.flavor || 'fresa';
        applyFlavorTheme(initialSlug, 'init');
    });
})();
