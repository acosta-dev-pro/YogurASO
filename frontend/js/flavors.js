/**
 * flavors.js — Sabores del hero (solo los que tienen foto de producto).
 * Fondos pastel por sabor: --bg-<sabor> en css/brand.css (hero, cards, ficha, rail).
 * Aquí solo va lo que cambia el contenido: nombre, texto alternativo y color del punto del selector.
 * El orden define cuál es el "siguiente" sabor que se ve atrás.
 */
window.YOGUR_FLAVORS = [
    { slug: 'fresa',        nombre: 'Fresa',        dot: '#D9202E', alt: 'Yogurt artesanal de fresa, 500 ml' },
    { slug: 'pina',         nombre: 'Piña',         dot: '#F2B90F', alt: 'Yogurt artesanal de piña, 500 ml' },
    { slug: 'mora',         nombre: 'Mora',         dot: '#7E2460', alt: 'Yogurt artesanal de mora, 500 ml' },
    { slug: 'melocoton',    nombre: 'Melocotón',    dot: '#EE6A22', alt: 'Yogurt artesanal de melocotón, 500 ml' },
    { slug: 'frutos-rojos', nombre: 'Frutos rojos', dot: '#C21842', alt: 'Yogurt artesanal de frutos rojos, 500 ml' },
    { slug: 'cafe',         nombre: 'Café',         dot: '#6B3420', alt: 'Yogurt artesanal de café, 500 ml' },
    { slug: 'guanabana',    nombre: 'Guanábana',    dot: '#3E8A25', alt: 'Yogurt artesanal de guanábana, 500 ml' },
    { slug: 'mango',        nombre: 'Mango',        dot: '#F39A12', alt: 'Yogurt artesanal de mango, 500 ml' }
];
