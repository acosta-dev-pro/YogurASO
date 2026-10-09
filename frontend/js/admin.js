/**
 * admin.js — Panel de YogurASO con estilo de vitrina.
 * Columna gris con marca, buscador y título; pestañas en píldora; a la izquierda
 * la tarjeta grande del yogur elegido (en su color fuerte) con controles rápidos,
 * y a la derecha la cuadrícula de tarjetas blancas.
 *
 * Datos de productos, fotos y usuarios: api.js (Supabase; RLS exige is_admin()).
 * Datos extra (preguntas, me gusta, pedidos, colores): js/admin/data.js.
 * Instagram: js/admin/instagram.js (pasa por una Edge Function; sin tokens aquí).
 */
import {
    fetchProducts, createProduct, updateProduct, permanentlyDeleteProduct,
    uploadImage, fetchUsers, toggleUserActive, verifyAdmin, syncSession
} from './api.js';
import { esc, cop, salePrice, photoFor, imgSrc, colorsFor, inkOn, initials } from './admin/shared.js';
import { exportWorkbook } from './admin/excel.js';
import { mountColores } from './admin/colores.js';
import { mountSocial } from './admin/social.js';
import { mountPreguntas } from './admin/preguntas.js';
import { mountPedidos } from './admin/pedidos.js';

const categoriaMap = {
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

const VIEWS = {
    inventario: { title: 'Inventario', search: 'Buscar sabor o #id' },
    colores: { title: 'Colores', search: 'Buscar sabor' },
    instagram: { title: 'Instagram', search: 'Buscar en publicaciones' },
    preguntas: { title: 'Preguntas', search: 'Buscar en preguntas' },
    pedidos: { title: 'Pedidos', search: 'Buscar pedido o cliente' },
    usuarios: { title: 'Usuarios', search: 'Buscar nombre o correo' }
};

const state = {
    view: 'inventario',
    products: [],
    productsError: '',
    users: [],
    cat: '',
    status: '',
    sort: 'orden:asc',
    featuredId: null,
    selected: new Set(),
    query: ''
};

let editandoId = null;
let guardando = false;
const views = {};

const $ = (id) => document.getElementById(id);
const toast = (msg, type = 'success') => window.YogurUtils?.showToast?.(msg, type);
const confirmAction = async (opts) => (window.YogurUtils?.confirmAction
    ? window.YogurUtils.confirmAction(opts)
    : window.confirm(opts.message));

function getUsuario() {
    try { return JSON.parse(localStorage.getItem('usuario') || 'null'); } catch { return null; }
}

/* ------------------------------------------------------------------ */
/* Contexto compartido con los módulos de cada vista                   */
/* ------------------------------------------------------------------ */
const ctx = {
    products: () => state.products,
    query: () => state.query,
    toast,
    confirm: confirmAction,
    go: (view) => { window.location.hash = `#${view}`; },
    reloadProducts: () => cargarProductos(),
    openEdit: (id) => openEdit(id),
    setQuestionCount: (n) => paintQuestionCount(n),
    updateProduct
};

/* ------------------------------------------------------------------ */
/* Navegación entre vistas                                             */
/* ------------------------------------------------------------------ */
function viewFromHash() {
    const h = (window.location.hash || '').replace('#', '').toLowerCase();
    if (h === 'productos' || !VIEWS[h]) return 'inventario';
    return h;
}

function showView(view) {
    state.view = view;
    document.body.dataset.view = view;
    document.querySelectorAll('.adm-view').forEach((sec) => {
        const on = sec.dataset.view === view;
        sec.hidden = !on;
        sec.classList.toggle('is-on', on);
    });
    document.querySelectorAll('.adm-tab').forEach((tab) => {
        const on = tab.dataset.view === view;
        tab.classList.toggle('is-on', on);
        if (on) tab.setAttribute('aria-current', 'page');
        else tab.removeAttribute('aria-current');
    });
    $('adm-title').textContent = VIEWS[view].title;
    $('adm-search').placeholder = VIEWS[view].search;
    views[view]?.open?.();
}

function rerenderCurrent() {
    if (state.view === 'inventario') renderInventario();
    else if (state.view === 'usuarios') renderUsers();
    else views[state.view]?.render?.();
}

/* ------------------------------------------------------------------ */
/* Inventario                                                          */
/* ------------------------------------------------------------------ */
function compare(a, b) {
    const [key, dir] = state.sort.split(':');
    const sign = dir === 'desc' ? -1 : 1;
    if (key === 'nombre') return sign * String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
    if (key === 'orden') return sign * ((Number(a.orden) || 0) - (Number(b.orden) || 0) || Number(a.id) - Number(b.id));
    return sign * (Number(a[key] || 0) - Number(b[key] || 0));
}

function visibleProducts() {
    const q = state.query.trim().toLowerCase().replace(/^#/, '');
    return state.products.filter((p) => {
        const matchQ = !q
            || String(p.nombre || '').toLowerCase().includes(q)
            || String(p.categoria || '').toLowerCase().includes(q)
            || String(p.id) === q;
        const matchCat = !state.cat || p.categoria === state.cat;
        const matchStatus = !state.status
            || (state.status === 'active' && p.activo)
            || (state.status === 'inactive' && !p.activo);
        return matchQ && matchCat && matchStatus;
    }).sort(compare);
}

function priceHtml(p, { big = false } = {}) {
    const off = Number(p.descuento || 0);
    const askPrice = !Number(p.precio);
    return `
        <div class="adm-price${big ? ' adm-price--big' : ''}">
            <small>${esc(p.volumen || '500 ml')}</small>
            ${off > 0 ? `<s>${cop(p.precio)}</s>` : ''}
            <strong>${askPrice ? 'Sin precio' : cop(salePrice(p))}</strong>
        </div>`;
}

function stockText(p) {
    const n = Number(p.stock || 0);
    if (n <= 0) return '<span class="adm-stock is-out">Sin stock</span>';
    if (n <= 5) return `<span class="adm-stock is-low">Quedan ${n}</span>`;
    return `<span class="adm-stock">${n} und.</span>`;
}

function cardHtml(p, i) {
    const c = colorsFor(p);
    const photo = photoFor(p);
    const sel = state.selected.has(p.id);
    return `
        <article class="adm-card${p.id === state.featuredId ? ' is-featured' : ''}${p.activo ? '' : ' is-off'}${sel ? ' is-selected' : ''}"
            data-id="${esc(p.id)}" style="--soft:${c.fondo};--strong:${c.fuerte};--i:${i}">
            <button type="button" class="adm-card-hit" data-pick="${esc(p.id)}" aria-label="Editar ${esc(p.nombre)}"></button>
            <div class="adm-card-head">
                <h3>${esc(p.nombre)}</h3>
                ${priceHtml(p)}
            </div>
            <div class="adm-card-fig">
                ${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true">` : '<span class="adm-card-nophoto">Sin foto</span>'}
            </div>
            <div class="adm-card-foot">
                <span class="adm-dot${p.activo ? ' is-on' : ''}">${p.activo ? 'A la venta' : 'Oculto'}</span>
                ${stockText(p)}
                ${p.letrero ? `<span class="adm-badge">${esc(p.letrero)}</span>` : ''}
            </div>
            <label class="adm-card-check" title="Seleccionar">
                <input type="checkbox" class="row-select" data-id="${esc(p.id)}" ${sel ? 'checked' : ''}>
                <span class="sr-only">Seleccionar ${esc(p.nombre)}</span>
            </label>
        </article>`;
}

function renderCats() {
    const host = $('adm-cats');
    if (!host) return;
    const counts = new Map();
    state.products.forEach((p) => counts.set(p.categoria || 'Sin categoría', (counts.get(p.categoria || 'Sin categoría') || 0) + 1));
    const cats = [...counts.keys()].sort((a, b) => a.localeCompare(b, 'es'));
    if (state.cat && !counts.has(state.cat)) state.cat = '';
    host.innerHTML = [`<button type="button" class="adm-cat${state.cat ? '' : ' is-on'}" data-cat="">Todos <span>${state.products.length}</span></button>`]
        .concat(cats.map((c) => `<button type="button" class="adm-cat${state.cat === c ? ' is-on' : ''}" data-cat="${esc(c)}">${esc(c)} <span>${counts.get(c)}</span></button>`))
        .join('');
}

function renderSummary() {
    const total = state.products.length;
    const activos = state.products.filter((p) => p.activo).length;
    const stock = state.products.reduce((acc, p) => acc + Number(p.stock || 0), 0);
    const line = $('admin-inventory-line');
    if (line) {
        line.textContent = state.productsError
            ? `${state.productsError}. Revisa tu conexión y recarga.`
            : (total ? `${total} productos · ${activos} a la venta · ${stock.toLocaleString('es-CO')} und. en nevera` : 'Aún no hay productos. Crea el primero con «Nuevo yogur».');
    }
    const chip = $('adm-chip-catalogo-txt');
    if (chip) chip.textContent = state.productsError ? 'Sin conexión' : `${activos} de ${total} a la venta`;
}

function renderInventario() {
    renderCats();
    renderSummary();
    const host = $('admin-productos-lista');
    if (!host) return;
    const list = visibleProducts();
    if (!list.length) {
        host.innerHTML = `<p class="adm-empty">${state.products.length ? 'No hay productos con estos filtros.' : 'Cuando crees productos, aparecen aquí.'}</p>`;
    } else {
        host.innerHTML = list.map(cardHtml).join('');
    }
    if (!state.products.some((p) => p.id === state.featuredId)) {
        state.featuredId = (list[0] || state.products[0])?.id ?? null;
        host.querySelector(`[data-id="${state.featuredId}"]`)?.classList.add('is-featured');
    }
    renderFeature();
    syncBulk();
}

function syncBulk() {
    const bar = $('adm-bulk');
    const n = state.selected.size;
    if (bar) bar.hidden = n === 0;
    const stat = $('stat-selected');
    if (stat) stat.textContent = String(n);
}

const DESCUENTOS = [0, 5, 10, 15, 20, 25, 30, 40, 50];
const LETREROS = { '': 'Sin letrero', nuevo: 'Nuevo', oferta: 'Oferta', descuento: 'Descuento', destacado: 'Destacado' };

function renderFeature() {
    const host = $('adm-feature');
    if (!host) return;
    const p = state.products.find((x) => x.id === state.featuredId);
    if (!p) {
        host.removeAttribute('style');
        host.innerHTML = `<p class="adm-feature-empty">${state.productsError ? 'Sin datos del catálogo por ahora.' : 'Elige un yogur de la lista para editarlo aquí.'}</p>`;
        return;
    }
    const c = colorsFor(p);
    const ink = inkOn(c.fuerte);
    host.style.setProperty('--f', c.fuerte);
    host.style.setProperty('--f-ink', ink);
    host.style.setProperty('--f-soft', c.fondo);
    host.classList.toggle('is-dark-ink', ink !== '#FFFFFF');
    const photo = photoFor(p);
    const off = Number(p.descuento || 0);
    const descOpts = [...new Set([...DESCUENTOS, off])].sort((a, b) => a - b);
    const tipo = p.letrero ? (p.letrero_tipo || 'destacado') : '';

    host.innerHTML = `
        <header class="adm-feature-head">
            <div>
                <span class="adm-feature-cat">${esc(p.categoria || 'Yogur')} · #${esc(p.id)}</span>
                <h2>${esc(p.nombre)}</h2>
            </div>
            ${priceHtml(p, { big: true })}
        </header>
        <figure class="adm-feature-fig">
            ${photo ? `<img src="${esc(photo)}" alt="${esc(p.nombre)}" onerror="this.hidden=true">` : '<span class="adm-card-nophoto">Sin foto</span>'}
        </figure>
        <form class="adm-feature-form" id="feature-form" novalidate>
            <div class="adm-frow">
                <label for="f-stock">Stock</label>
                <div class="adm-stepper">
                    <button type="button" data-step="-1" aria-label="Quitar una unidad">−</button>
                    <input type="number" id="f-stock" min="0" step="1" value="${Number(p.stock || 0)}" inputmode="numeric">
                    <button type="button" data-step="1" aria-label="Sumar una unidad">+</button>
                </div>
            </div>
            <div class="adm-frow">
                <label for="f-estado">Estado</label>
                <select id="f-estado" class="adm-fsel">
                    <option value="1" ${p.activo ? 'selected' : ''}>A la venta</option>
                    <option value="0" ${p.activo ? '' : 'selected'}>Oculto</option>
                </select>
            </div>
            <div class="adm-for" aria-hidden="true"><span>promoción</span></div>
            <div class="adm-frow">
                <label for="f-letrero">Letrero</label>
                <select id="f-letrero" class="adm-fsel">
                    ${Object.entries(LETREROS).map(([v, l]) => `<option value="${v}" ${v === tipo ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>
            <div class="adm-frow">
                <label for="f-desc">Descuento</label>
                <select id="f-desc" class="adm-fsel">
                    ${descOpts.map((d) => `<option value="${d}" ${d === off ? 'selected' : ''}>${d ? `${d}%` : 'Ninguno'}</option>`).join('')}
                </select>
            </div>
            <button type="submit" class="adm-feature-cta" id="f-save">Guardar cambios</button>
        </form>
        <nav class="adm-feature-links" aria-label="Más acciones">
            <button type="button" data-act="edit">Ficha completa</button>
            <button type="button" data-act="colors">Colores</button>
            <button type="button" data-act="delete">Eliminar</button>
        </nav>`;

    host.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
        const input = $('f-stock');
        input.value = String(Math.max(0, Math.trunc(Number(input.value || 0)) + Number(b.dataset.step)));
    }));
    host.querySelector('#feature-form').addEventListener('submit', (e) => {
        e.preventDefault();
        quickSave(p);
    });
    host.querySelector('[data-act="edit"]').addEventListener('click', () => openEdit(p.id));
    host.querySelector('[data-act="colors"]').addEventListener('click', () => {
        views.colores?.select?.(p.id);
        ctx.go('colores');
    });
    host.querySelector('[data-act="delete"]').addEventListener('click', () => deleteForever(p));
}

function letreroText(tipo, off, p) {
    if (!tipo) return '';
    if (tipo === 'descuento') return off > 0 ? `-${off}%` : 'Descuento';
    if (p.letrero && (p.letrero_tipo || 'destacado') === tipo && tipo !== 'descuento') return p.letrero;
    return LETREROS[tipo];
}

async function quickSave(p) {
    const btn = $('f-save');
    const stock = Math.trunc(Number($('f-stock').value));
    if (!Number.isInteger(stock) || stock < 0) {
        toast('Escribe un stock válido (0 o más).', 'error');
        $('f-stock').focus();
        return;
    }
    const off = Number($('f-desc').value || 0);
    const tipo = $('f-letrero').value;
    const payload = {
        stock,
        activo: $('f-estado').value === '1',
        descuento: off,
        letrero: letreroText(tipo, off, p),
        letrero_tipo: tipo
    };
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    const res = await updateProduct(p.id, payload);
    btn.disabled = false;
    btn.textContent = 'Guardar cambios';
    if (!res.success) {
        toast(res.message || 'No se pudo guardar', 'error');
        return;
    }
    toast(`${p.nombre}: cambios guardados`, 'success');
    await cargarProductos();
}

async function deleteForever(p) {
    const ok = await confirmAction({
        title: 'Eliminar producto definitivamente',
        message: `¿Eliminar "${p.nombre}" del catálogo? No se puede deshacer. También sale de los carritos guardados; el historial de pedidos conserva su detalle. Si solo quieres esconderlo, ponlo en «Oculto».`,
        confirmText: 'Eliminar definitivamente',
        cancelText: 'Conservar',
        danger: true,
        type: 'danger'
    });
    if (!ok) return;
    const res = await permanentlyDeleteProduct(p.id);
    if (!res.success) {
        toast(res.message || 'No se pudo eliminar', 'error');
        return;
    }
    state.selected.delete(p.id);
    if (state.featuredId === p.id) state.featuredId = null;
    toast('Producto eliminado', 'success');
    await cargarProductos();
}

async function bulkSetActive(activo) {
    const ids = [...state.selected];
    if (!ids.length) return;
    const ok = await confirmAction({
        title: activo ? 'Poner a la venta' : 'Ocultar productos',
        message: `¿${activo ? 'Poner a la venta' : 'Ocultar'} ${ids.length} producto(s)?`,
        confirmText: activo ? 'Sí, poner a la venta' : 'Sí, ocultar',
        cancelText: 'Cancelar',
        danger: !activo,
        type: activo ? 'success' : 'warning'
    });
    if (!ok) return;
    let done = 0;
    for (const id of ids) {
        const res = await updateProduct(id, { activo });
        if (res.success) done += 1;
    }
    state.selected.clear();
    toast(`${done} producto(s) ${activo ? 'a la venta' : 'ocultos'}`, done ? 'success' : 'error');
    await cargarProductos();
}

async function cargarProductos() {
    const list = await fetchProducts(true);
    state.productsError = list._error || '';
    state.products = list._error ? [] : list;
    renderInventario();
    views.colores?.refresh?.();
    if (state.view !== 'inventario') views[state.view]?.render?.();
    return state.products;
}

/* ------------------------------------------------------------------ */
/* Ficha completa (modal): crear y editar, con foto                    */
/* ------------------------------------------------------------------ */
function setSubmitLabel(isEdit) {
    const btn = $('btn-guardar-producto');
    if (btn) btn.textContent = isEdit ? 'Guardar cambios' : 'Crear producto';
}

function abrirModal(titulo, { isEdit = false } = {}) {
    $('modal-title').textContent = titulo;
    $('modal-eyebrow').textContent = isEdit ? 'Edición' : 'Alta';
    $('modal-hint').textContent = isEdit
        ? 'Actualiza precio, stock, foto o visibilidad del producto.'
        : 'Completa los datos del yogur para publicarlo en el catálogo.';
    setSubmitLabel(isEdit);
    const modal = $('modal-producto');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => $('p-nombre')?.focus(), 40);
}

function cerrarModal() {
    const modal = $('modal-producto');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    limpiarFormulario();
}

function limpiarFormulario() {
    editandoId = null;
    guardando = false;
    $('form-producto')?.reset();
    $('p-id').value = '';
    $('p-activo').checked = true;
    $('p-categoria').value = 'natural';
    $('p-color-fondo').value = '#FFF8F4';
    $('p-letrero-tipo').value = '';
    $('p-letrero').value = '';
    $('p-descuento').value = '0';
    resetImageUpload();
    setSubmitLabel(false);
    syncPromoPreview();
}

function syncPromoPreview() {
    const precio = Number($('p-precio')?.value || 0);
    const tipoEl = $('p-letrero-tipo');
    const textoEl = $('p-letrero');
    const descEl = $('p-descuento');
    let off = Math.round(Number(descEl?.value || 0));
    if (!Number.isFinite(off) || off < 0) off = 0;
    if (off > 80) off = 80;
    if (descEl && Number(descEl.value) !== off) descEl.value = String(off);

    const tipo = tipoEl?.value || '';
    if (textoEl) {
        textoEl.disabled = tipo === '';
        if (tipo === 'descuento' && off > 0 && (!textoEl.value.trim() || /^-\d+%$/.test(textoEl.value.trim()))) textoEl.value = `-${off}%`;
        if (tipo === 'descuento' && off === 0 && /^-\d+%$/.test(textoEl.value.trim())) textoEl.value = '';
        if (['nuevo', 'oferta', 'destacado'].includes(tipo) && !textoEl.value.trim()) textoEl.value = LETREROS[tipo];
        if (tipo === '') textoEl.value = '';
    }

    const final = off > 0 ? Math.round(precio * (1 - off / 100)) : precio;
    $('admin-price-before').textContent = cop(precio);
    const after = $('admin-price-after');
    after.textContent = cop(final);
    after.classList.toggle('is-sale', off > 0);
    $('admin-price-preview-note').textContent = off > 0
        ? `Ahorro ${off}%: el cliente ve ${cop(final)} (antes ${cop(precio)}).`
        : 'Sin descuento: se muestra el precio normal.';
    const badge = $('admin-price-preview-badge');
    const label = (textoEl?.value || '').trim();
    badge.hidden = !label;
    badge.textContent = label;
    badge.className = `adm-price-badge badge-${tipo || 'nuevo'}`;
    $('admin-price-preview').classList.toggle('has-discount', off > 0);
}

function setupPromoControls() {
    const tipo = $('p-letrero-tipo');
    const texto = $('p-letrero');
    const desc = $('p-descuento');
    [$('p-precio'), desc].forEach((el) => {
        el?.addEventListener('input', syncPromoPreview);
        el?.addEventListener('change', syncPromoPreview);
    });
    tipo?.addEventListener('change', () => {
        const t = tipo.value;
        const off = Math.round(Number(desc?.value || 0));
        texto.value = t === 'descuento' ? (off > 0 ? `-${off}%` : '') : (LETREROS[t] && t ? LETREROS[t] : '');
        syncPromoPreview();
    });
    ['input', 'change'].forEach((ev) => texto?.addEventListener(ev, () => {
        if (!texto.value.trim() && tipo?.value) tipo.selectedIndex = 0;
        syncPromoPreview();
    }));
    syncPromoPreview();
}

function resetImageUpload() {
    $('image-upload-placeholder').hidden = false;
    const preview = $('image-preview');
    preview.hidden = true;
    preview.removeAttribute('src');
    $('image-remove-btn').hidden = true;
    $('p-imagen-file').value = '';
    const hidden = $('p-imagen');
    hidden.value = '';
    hidden._pendingFile = null;
}

function setImagePreview(url) {
    if (!url) {
        resetImageUpload();
        return;
    }
    $('image-upload-placeholder').hidden = true;
    const preview = $('image-preview');
    preview.src = url;
    preview.hidden = false;
    $('image-remove-btn').hidden = false;
}

function handleFileSelected(file) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
        toast('Solo se permiten fotos JPG, PNG, WEBP o GIF', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        toast('La foto no puede pasar de 5 MB', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    $('p-imagen')._pendingFile = file;
}

function setupImageUpload() {
    const area = $('image-upload-area');
    const fileInput = $('p-imagen-file');
    area.addEventListener('click', (e) => {
        if (e.target.closest('#image-remove-btn')) return;
        fileInput.click();
    });
    area.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
    });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFileSelected(file);
    });
    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) handleFileSelected(file);
    });
    $('image-remove-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetImageUpload();
    });
}

async function uploadPendingImage() {
    const hidden = $('p-imagen');
    if (!hidden._pendingFile) return { success: true, url: hidden.value || '' };
    const data = await uploadImage(hidden._pendingFile);
    if (data.success && data.url) {
        hidden.value = data.url;
        hidden._pendingFile = null;
        return { success: true, url: data.url };
    }
    return { success: false, message: data.message || 'Error al subir la foto' };
}

function payloadDesdeFormulario() {
    const categoriaKey = $('p-categoria').value || 'natural';
    const letrero = $('p-letrero').value.trim();
    const tipo = $('p-letrero-tipo').value || '';
    return {
        nombre: $('p-nombre').value.trim(),
        precio: Number($('p-precio').value || 0),
        stock: Number($('p-stock').value || 0),
        descripcion: $('p-descripcion').value.trim(),
        imagen_url: $('p-imagen').value.trim(),
        categoria: categoriaMap[categoriaKey] || 'Natural',
        color_fondo: $('p-color-fondo').value || '#FFF8F4',
        activo: $('p-activo').checked,
        letrero,
        letrero_tipo: letrero ? tipo : '',
        descuento: Number($('p-descuento').value || 0)
    };
}

function llenarFormulario(p) {
    $('p-id').value = p.id;
    $('p-nombre').value = p.nombre || '';
    $('p-precio').value = p.precio || 0;
    $('p-stock').value = p.stock || 0;
    $('p-descripcion').value = p.descripcion || '';
    $('p-imagen').value = p.imagen_url || '';
    if (p.imagen_url) setImagePreview(imgSrc(p.imagen_url));
    else resetImageUpload();

    let key = Object.keys(categoriaMap).find((k) => categoriaMap[k] === p.categoria);
    const select = $('p-categoria');
    if (!key && p.categoria) {
        // Categoría que viene de la base (p. ej. "Frutales"): se agrega para no perderla al guardar.
        key = `db_${String(p.categoria).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        categoriaMap[key] = p.categoria;
        if (!select.querySelector(`option[value="${key}"]`)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = p.categoria;
            select.appendChild(opt);
        }
    }
    select.value = key || 'natural';
    $('p-color-fondo').value = colorsFor(p).fondo;
    $('p-activo').checked = Boolean(p.activo);
    $('p-letrero-tipo').value = p.letrero ? (p.letrero_tipo || '') : '';
    $('p-letrero').value = p.letrero || '';
    $('p-descuento').value = p.descuento || 0;
    syncPromoPreview();
}

function openEdit(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    editandoId = id;
    llenarFormulario(p);
    abrirModal('Editar producto', { isEdit: true });
}

function setupModal() {
    const modal = $('modal-producto');
    const form = $('form-producto');
    $('btn-nuevo-producto').addEventListener('click', () => {
        limpiarFormulario();
        abrirModal('Nuevo producto');
    });
    $('btn-cerrar-modal').addEventListener('click', cerrarModal);
    $('btn-cancelar-modal').addEventListener('click', cerrarModal);
    $('modal-to-colores').addEventListener('click', () => {
        const id = editandoId;
        cerrarModal();
        if (id) views.colores?.select?.(id);
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) cerrarModal();
    });
    setupPromoControls();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (guardando) return;
        syncPromoPreview();
        const payload = payloadDesdeFormulario();
        if (!payload.nombre) {
            toast('El nombre es obligatorio', 'error');
            $('p-nombre').focus();
            return;
        }
        if (!Number.isFinite(payload.precio) || payload.precio < 0) {
            toast('Escribe un precio válido', 'error');
            $('p-precio').focus();
            return;
        }
        if (!Number.isInteger(payload.stock) || payload.stock < 0) {
            toast('Escribe un stock válido (número entero)', 'error');
            $('p-stock').focus();
            return;
        }
        // Si el color es el mismo de marca, no se fija en la base: así la tienda sigue la marca.
        const before = editandoId ? state.products.find((p) => p.id === editandoId) : null;
        if (before && payload.color_fondo.toUpperCase() === colorsFor(before).fondo && colorsFor(before).fondoOrigen === 'marca') {
            delete payload.color_fondo;
        }

        guardando = true;
        const btn = $('btn-guardar-producto');
        btn.disabled = true;
        btn.textContent = 'Guardando…';
        try {
            const up = await uploadPendingImage();
            if (!up.success) {
                toast(up.message || 'No se pudo subir la foto', 'error');
                return;
            }
            payload.imagen_url = up.url;
            const wasEdit = Boolean(editandoId);
            const res = wasEdit ? await updateProduct(editandoId, payload) : await createProduct(payload);
            if (!res.success) {
                toast(res.message || 'No se pudo guardar el producto', 'error');
                return;
            }
            toast(wasEdit ? 'Producto actualizado' : 'Producto creado', 'success');
            if (res.product?.id) state.featuredId = res.product.id;
            cerrarModal();
            await cargarProductos();
        } finally {
            guardando = false;
            btn.disabled = false;
            setSubmitLabel(Boolean(editandoId));
        }
    });
}

/* ------------------------------------------------------------------ */
/* Usuarios                                                            */
/* ------------------------------------------------------------------ */
function visibleUsers() {
    const q = state.query.trim().toLowerCase();
    if (!q) return state.users;
    return state.users.filter((u) => `${u.nombre || ''} ${u.apellido || ''} ${u.email || ''} ${u.id}`.toLowerCase().includes(q));
}

function renderUsers(errorMsg) {
    const host = $('admin-usuarios-lista');
    if (!host) return;
    if (errorMsg) {
        host.innerHTML = `<p class="adm-empty">${esc(errorMsg)}</p>`;
        return;
    }
    const yo = getUsuario();
    const list = visibleUsers();
    const count = $('u-count');
    if (count) {
        const activos = state.users.filter((u) => u.activo).length;
        count.textContent = state.users.length ? `${state.users.length} cuentas · ${activos} activas` : '';
    }
    if (!list.length) {
        host.innerHTML = `<p class="adm-empty">${state.users.length ? 'Nadie coincide con la búsqueda.' : 'Todavía no hay cuentas registradas.'}</p>`;
        return;
    }
    host.innerHTML = list.map((u) => {
        const name = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Sin nombre';
        const isMe = yo?.id === u.id;
        return `
        <article class="adm-user${u.activo ? '' : ' is-off'}">
            <span class="adm-avatar" aria-hidden="true">${esc(initials(name))}</span>
            <div class="adm-user-main">
                <strong>${esc(name)}${isMe ? ' <em>(tú)</em>' : ''}</strong>
                <span>${esc(u.email || '')}${u.telefono ? ` · ${esc(u.telefono)}` : ''}</span>
            </div>
            <span class="adm-badge${u.rol === 'admin' ? ' is-red' : ''}">${u.rol === 'admin' ? 'Admin' : 'Cliente'}</span>
            <span class="adm-dot${u.activo ? ' is-on' : ''}">${u.activo ? 'Activa' : 'Pausada'}</span>
            <button type="button" class="adm-btn adm-btn--sm btn-toggle-user" data-id="${esc(u.id)}" ${isMe ? 'disabled title="No puedes pausar tu propia cuenta"' : ''}>
                ${u.activo ? 'Pausar' : 'Activar'}
            </button>
        </article>`;
    }).join('');
}

async function cargarUsuarios() {
    const res = await fetchUsers();
    if (!res.success) {
        renderUsers(res.message || 'No se pudieron cargar los usuarios');
        return;
    }
    state.users = res.users || [];
    renderUsers();
}

/* ------------------------------------------------------------------ */
/* Cabecera: saludo, campanita y exportar                              */
/* ------------------------------------------------------------------ */
function paintQuestionCount(n) {
    const badge = $('adm-bell-badge');
    const tab = $('adm-tab-preguntas');
    const chip = $('adm-chip-preguntas-txt');
    if (n == null) {
        if (chip) chip.textContent = 'Sin conectar';
        return;
    }
    if (badge) {
        badge.hidden = n <= 0;
        badge.textContent = n > 99 ? '99+' : String(n);
    }
    if (tab) {
        tab.hidden = n <= 0;
        tab.textContent = String(n);
    }
    if (chip) chip.textContent = n > 0 ? `${n} por revisar` : 'Todo al día';
}

function paintHello() {
    const u = getUsuario();
    const fecha = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' }).format(new Date());
    const hello = $('adm-hello');
    if (hello) hello.innerHTML = `Hola${u?.nombre ? `, <strong>${esc(u.nombre)}</strong>` : ''} <span>· ${esc(fecha)}</span>`;
}

async function exportar() {
    const btn = $('btn-export-xlsx');
    btn.disabled = true;
    btn.textContent = 'Preparando…';
    try {
        const [questions, orders] = await Promise.all([
            views.preguntas?.data?.() || [],
            views.pedidos?.data?.() || []
        ]);
        const res = await exportWorkbook({ products: visibleProducts().length ? visibleProducts() : state.products, questions, orders });
        toast(res.format === 'xlsx'
            ? `Excel listo (${res.sheets} ${res.sheets === 1 ? 'hoja' : 'hojas'})`
            : 'Sin conexión a la librería de Excel: se bajó en CSV', res.format === 'xlsx' ? 'success' : 'info');
    } catch (error) {
        console.error('[admin] exportar', error);
        toast('No se pudo exportar', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Exportar a Excel';
    }
}

/* ------------------------------------------------------------------ */
/* Eventos                                                             */
/* ------------------------------------------------------------------ */
function setupEvents() {
    $('adm-search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        state.query = $('adm-search').value;
        rerenderCurrent();
    });
    $('adm-search').addEventListener('input', () => {
        state.query = $('adm-search').value;
        rerenderCurrent();
    });
    $('adm-cats').addEventListener('click', (e) => {
        const b = e.target.closest('[data-cat]');
        if (!b) return;
        state.cat = b.dataset.cat;
        renderInventario();
    });
    $('admin-filter-status').addEventListener('change', (e) => {
        state.status = e.target.value;
        renderInventario();
    });
    $('admin-sort').addEventListener('change', (e) => {
        state.sort = e.target.value;
        renderInventario();
    });
    const grid = $('admin-productos-lista');
    grid.addEventListener('click', (e) => {
        const pick = e.target.closest('[data-pick]');
        if (!pick) return;
        state.featuredId = Number(pick.dataset.pick);
        grid.querySelectorAll('.adm-card').forEach((c) => c.classList.toggle('is-featured', Number(c.dataset.id) === state.featuredId));
        renderFeature();
        if (window.matchMedia('(max-width: 860px)').matches) $('adm-feature').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    grid.addEventListener('change', (e) => {
        const box = e.target.closest('.row-select');
        if (!box) return;
        const id = Number(box.dataset.id);
        if (box.checked) state.selected.add(id);
        else state.selected.delete(id);
        box.closest('.adm-card')?.classList.toggle('is-selected', box.checked);
        syncBulk();
    });
    $('btn-select-visible').addEventListener('click', () => {
        visibleProducts().forEach((p) => state.selected.add(p.id));
        renderInventario();
    });
    $('btn-bulk-activate').addEventListener('click', () => bulkSetActive(true));
    $('btn-bulk-deactivate').addEventListener('click', () => bulkSetActive(false));
    $('btn-bulk-clear').addEventListener('click', () => {
        state.selected.clear();
        renderInventario();
    });
    $('btn-export-xlsx').addEventListener('click', exportar);
    $('btn-reload-users').addEventListener('click', cargarUsuarios);
    $('admin-usuarios-lista').addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-toggle-user');
        if (!btn || btn.disabled) return;
        btn.disabled = true;
        const res = await toggleUserActive(btn.dataset.id);
        btn.disabled = false;
        if (!res.success) {
            toast(res.message || 'No se pudo actualizar', 'error');
            return;
        }
        toast(res.message || 'Cuenta actualizada', 'success');
        await cargarUsuarios();
    });
    window.addEventListener('hashchange', () => showView(viewFromHash()));
}

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = getUsuario();
    if (!localStorage.getItem('token') || !usuario || usuario.rol !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    // El espejo local se puede editar a mano: la última palabra la tiene la base.
    if (!(await verifyAdmin())) {
        const { session } = await syncSession();
        window.location.href = session ? '../index.html' : 'login.html';
        return;
    }

    paintHello();
    views.colores = mountColores(ctx);
    views.instagram = mountSocial(ctx);
    views.preguntas = mountPreguntas(ctx);
    views.pedidos = mountPedidos(ctx);
    setupImageUpload();
    setupModal();
    setupEvents();
    await cargarProductos();
    showView(viewFromHash());
    views.preguntas.refreshCount();
    cargarUsuarios();
});

