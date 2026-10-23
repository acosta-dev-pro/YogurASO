/**
 * theme-reactor.js — Motor de sincronización dinámica bidireccional de color.
 * Permite que toda la tienda (cabecero, sobre nosotros, proceso, propósito,
 * llévalo contigo, nuestros yogures y distribuidores) adapte su atmósfera
 * pastel y acentos al sabor seleccionado tanto desde el hero como desde el carrusel inferior.
 */
(function () {
    'use strict';

    const FLAVOR_THEMES = {
        'fresa': {
            slug: 'fresa',
            nombre: 'Fresa',
            accent: '#C3343E',
            heroBg: '#C3343E',
            wash: '#FFF5F6',
            cardTint: '#FDE8EA',
            border: 'rgba(195, 52, 62, 0.20)',
            handImg: 'assets/marketing/mano-botella-fresa-cutout.webp'
        },
        'melocoton': {
            slug: 'melocoton',
            nombre: 'Melocotón',
            accent: '#DD6827',
            heroBg: '#DD6827',
            wash: '#FFF6F0',
            cardTint: '#FEECE0',
            border: 'rgba(221, 104, 39, 0.20)',
            handImg: 'assets/marketing/mano-botella-melocoton-cutout.png'
        },
        'pina': {
            slug: 'pina',
            nombre: 'Piña',
            accent: '#D89B00',
            heroBg: '#E4A30F',
            wash: '#FFFDF2',
            cardTint: '#FEF7D9',
            border: 'rgba(228, 163, 15, 0.20)',
            handImg: 'assets/marketing/mano-botella-pina-cutout.png'
        },
        'mora': {
            slug: 'mora',
            nombre: 'Mora',
            accent: '#82366B',
            heroBg: '#82366B',
            wash: '#FAF5F9',
            cardTint: '#F4E7F1',
            border: 'rgba(130, 54, 107, 0.20)',
            handImg: 'assets/marketing/mano-botella-mora-cutout.png'
        },
        'guanabana': {
            slug: 'guanabana',
            nombre: 'Guanábana',
            accent: '#3E8A25',
            heroBg: '#488738',
            wash: '#F5FAF3',
            cardTint: '#EBF5E7',
            border: 'rgba(72, 135, 56, 0.20)',
            handImg: 'assets/marketing/mano-botella-guanabana-cutout.png'
        },
        'mango': {
            slug: 'mango',
            nombre: 'Mango',
            accent: '#ED8311',
            heroBg: '#ED8311',
            wash: '#FFF7ED',
            cardTint: '#FEEDD7',
            border: 'rgba(237, 131, 17, 0.20)',
            handImg: 'assets/marketing/mano-botella-mango-cutout.png'
        },
        'cafe': {
            slug: 'cafe',
            nombre: 'Café',
            accent: '#663E31',
            heroBg: '#663E31',
            wash: '#F9F6F4',
            cardTint: '#EFE8E3',
            border: 'rgba(102, 62, 49, 0.20)',
            handImg: 'assets/marketing/mano-botella-cafe-cutout.png'
        },
        'frutos-rojos': {
            slug: 'frutos-rojos',
            nombre: 'Frutos Rojos',
            accent: '#B12C4E',
            heroBg: '#B12C4E',
            wash: '#FDF5F7',
            cardTint: '#FBE5EA',
            border: 'rgba(177, 44, 78, 0.20)',
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
        // 1. Inyectar variables globales de color en :root
        root.style.setProperty('--flavor-accent', theme.accent);
        root.style.setProperty('--flavor-hero-bg', theme.heroBg);
        root.style.setProperty('--flavor-wash', theme.wash);
        root.style.setProperty('--flavor-card-tint', theme.cardTint);
        root.style.setProperty('--flavor-border', theme.border);
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

        // 5. Notificar a otros módulos si no es un bucle
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
