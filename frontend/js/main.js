/**
 * main.js — Catálogo (pages/productos.html): pide los yogures, filtra y pinta la cuadrícula.
 * En el inicio solo da la bienvenida tras entrar o registrarse; el carrusel está en home-products-carousel.js.
 * Las tarjetas (HTML y botones) están en tarjeta-yogur.js; precios y datos en catalogo.js.
 */
import { loadCatalogProducts, matchFlavorSlug } from './catalogo.js';
import { cardHtml, bindCardActions } from './tarjeta-yogur.js';

const container = document.getElementById('productos-container');
const GRUPOS = {
    Frutales: ['fresa', 'pina', 'mora', 'melocoton', 'mango', 'frutos-rojos'],
    'Clásicos': ['fresa', 'pina', 'mora', 'melocoton'],
    Especiales: ['cafe', 'guanabana']
};
const CATEGORIAS = [['all', 'Todos'], ['Frutales', 'Frutales'], ['Clásicos', 'Clásicos'], ['Especiales', 'Especiales']];
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

let productos = [];
let filtro = { q: '', categoria: 'all', orden: 'default' };

/** Aviso de bienvenida solo después de entrar o registrarse. */
function bienvenida() {
    if (sessionStorage.getItem('yogur_just_logged_in') !== '1') return;
    sessionStorage.removeItem('yogur_just_logged_in');
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    window.YogurUtils?.showToast?.(`Bienvenido ${usuario?.nombre || 'a YogurASO'}`, 'success');
}

function filtrados() {
    const q = norm(filtro.q.trim());
    let lista = productos.filter((p) => {
        if (q && ![p.nombre, p.descripcion, p.categoria, p.sabor, p.slug].some((t) => norm(t).includes(q))) return false;
        if (filtro.categoria === 'all') return true;
        return p.categoria === filtro.categoria || (GRUPOS[filtro.categoria] || []).includes(matchFlavorSlug(p) || p.slug);
    });
    const orden = {
        'price-asc': (a, b) => Number(a.precio) - Number(b.precio),
        'price-desc': (a, b) => Number(b.precio) - Number(a.precio),
        'name-asc': (a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es')
    }[filtro.orden] || ((a, b) => Number(b.id) - Number(a.id));
    return lista.sort(orden);
}

function pintar() {
    const lista = filtrados();
    const cuenta = document.getElementById('catalog-count');
    if (cuenta) cuenta.textContent = lista.length === 1 ? '1 producto' : `${lista.length} productos`;
    if (!lista.length) {
        container.innerHTML = `<div class="catalog-empty"><i class="fas fa-search" aria-hidden="true"></i><p>No encontramos productos con esos filtros.</p>
            <button type="button" class="btn-primary" id="btn-reset-filters">Limpiar filtros</button></div>`;
        document.getElementById('btn-reset-filters').addEventListener('click', limpiar);
        return;
    }
    container.innerHTML = lista.map((p, i) => cardHtml(p, i, lista.length)).join('');
    container.querySelector('.hp-card')?.classList.add('is-active');
}

function limpiar() {
    filtro = { q: '', categoria: 'all', orden: 'default' };
    document.getElementById('catalog-search').value = '';
    document.getElementById('filtro-orden').value = 'default';
    document.querySelectorAll('#catalog-chips .chip').forEach((c) => c.classList.toggle('is-on', c.dataset.cat === 'all'));
    pintar();
}

function controles() {
    const chips = document.getElementById('catalog-chips');
    if (chips) {
        chips.innerHTML = CATEGORIAS.map(([id, nombre]) => `<button type="button" class="chip${id === 'all' ? ' is-on' : ''}" data-cat="${id}">${nombre}</button>`).join('');
        chips.addEventListener('click', (e) => {
            const b = e.target.closest('[data-cat]');
            if (!b) return;
            filtro.categoria = b.dataset.cat;
            chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === b));
            pintar();
        });
    }
    document.getElementById('catalog-search')?.addEventListener('input', (e) => { filtro.q = e.target.value; pintar(); });
    document.getElementById('filtro-orden')?.addEventListener('change', (e) => { filtro.orden = e.target.value; pintar(); });
}

async function cargar() {
    productos = await loadCatalogProducts();
    pintar();
}

document.addEventListener('DOMContentLoaded', () => {
    bienvenida();
    window.Cart?.updateCounter();
    if (!container) return;
    container.innerHTML = '<p class="cargando">Cargando productos...</p>';
    controles();
    bindCardActions(container, (id) => productos.find((p) => String(p.id) === id));
    cargar();

    // El panel avisa cuando cambia el catálogo; al volver a la pestaña, si pasaron más de 45 s, se pide otra vez.
    let ultima = Date.now();
    const refrescar = () => { ultima = Date.now(); cargar(); };
    window.addEventListener('storage', (e) => { if (e.key === 'yog_products_sync_v1') refrescar(); });
    window.addEventListener('yog:catalog-updated', refrescar);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - ultima > 45000) refrescar(); });
    window.addEventListener('pageshow', (e) => { if (e.persisted && Date.now() - ultima > 45000) refrescar(); });
});
