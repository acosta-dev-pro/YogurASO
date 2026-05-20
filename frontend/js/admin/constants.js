/**
 * Datos fijos del panel: categorías, paletas por sabor y ruta de imágenes.
 */

/** Convierte rutas relativas "assets/..." para que carguen correctamente desde "/pages/admin.html" */
export function imgSrc(url) {
    const s = String(url || '');
    if (!s || /^(https?:|data:|blob:|\/|\.\.\/)/i.test(s)) return s;
    return `../${s.replace(/^\.\//, '')}`;
}

/** Mapa canónico de categorías (incluye las categorías reales de Supabase + adicionales) */
export const categoriaMap = {
    Frutales: 'Frutales',
    Especiales: 'Especiales',
    'Clásicos': 'Clásicos',
    natural: 'Natural',
    frutas: 'Con Frutas',
    griego: 'Griego',
    sin_lactosa: 'Sin Lactosa',
    leches: 'Leches',
    quesos: 'Quesos',
    kumis: 'Kumis',
    arequipe: 'Arequipe',
    suero: 'Suero Costeño'
};

/** Colores oscuros y claros por defecto según el sabor del yogur */
export const FLAVOR_PALETTES = {
    fresa: { dark: '#C3343E', light: '#F4CBCF', bottle: 'assets/products/yoguraso-fresa-500ml-sm.webp' },
    pina: { dark: '#E4A30F', light: '#FBE8BD', bottle: 'assets/products/yoguraso-pina-500ml-sm.webp' },
    mora: { dark: '#82366B', light: '#E6CDD9', bottle: 'assets/products/yoguraso-mora-500ml-sm.webp' },
    melocoton: { dark: '#DD6827', light: '#FAD9C6', bottle: 'assets/products/yoguraso-melocoton-500ml-sm.webp' },
    'frutos-rojos': { dark: '#B12C4E', light: '#F2C9D4', bottle: 'assets/products/yoguraso-frutos-rojos-500ml-sm.webp' },
    mango: { dark: '#ED8311', light: '#FCE0BF', bottle: 'assets/products/yoguraso-mango-500ml-sm.webp' },
    cafe: { dark: '#663E31', light: '#E2D6D1', bottle: 'assets/products/yoguraso-cafe-500ml-sm.webp' },
    guanabana: { dark: '#488738', light: '#D6EBCD', bottle: 'assets/products/yoguraso-guanabana-500ml-sm.webp' },
    griego: { dark: '#1D457C', light: '#C7DAF4', bottle: 'assets/products/yoguraso-griego-500ml-sm.webp' }
};

export const DARK_TONE_NAMES = {
    '#c3343e': 'Fresa',
    '#8a1528': 'Fresa Profunda',
    '#82366b': 'Mora',
    '#5a1a32': 'Mora Profunda',
    '#dd6827': 'Melocotón',
    '#7c3b0d': 'Melocotón Tostado',
    '#b12c4e': 'Frutos Rojos',
    '#4a1228': 'Frutos Silvestres',
    '#663e31': 'Café',
    '#3b2314': 'Café Huilense',
    '#488738': 'Guanábana',
    '#1f4a24': 'Guanábana Bosque',
    '#e4a30f': 'Piña',
    '#784400': 'Piña Ámbar',
    '#ed8311': 'Mango',
    '#3f4e8c': 'Arándano'
};
