/**
 * admin/colores.js — Colores de cada producto con vista previa en vivo.
 * Fondo claro (pastel) -> products.background_color (api.js ya lo guarda).
 * Color fuerte -> products.accent_color. Mientras api.js no lo envíe,
 * queda también en este navegador (ver data.js) y el panel lo avisa.
 */
import { esc, cop, salePrice, photoFor, colorsFor, brandColors, inkOn, contrast, isHex, flavorOf } from './shared.js';
import { writeLocalColor } from './data.js';

export function mountColores(ctx) {
    const $ = (id) => document.getElementById(id);
    let currentId = null;
    let draft = null; // { fondo, fuerte }

    const list = () => {
        const q = ctx.query().trim().toLowerCase();
        return ctx.products().filter((p) => !q || String(p.nombre || '').toLowerCase().includes(q));
    };

    function current() {
        return ctx.products().find((p) => p.id === currentId) || null;
    }

    function ensureCurrent() {
        const all = ctx.products();
        if (!all.some((p) => p.id === currentId)) {
            currentId = all[0]?.id ?? null;
            draft = null;
        }
        const p = current();
        if (p && !draft) {
            const c = colorsFor(p);
            draft = { fondo: c.fondo, fuerte: c.fuerte };
        }
    }

    function renderChips() {
        const host = $('color-products');
        host.innerHTML = list().map((p) => {
            const c = p.id === currentId && draft ? draft : colorsFor(p);
            return `<button type="button" class="adm-cat adm-cat--swatch${p.id === currentId ? ' is-on' : ''}" data-color-id="${esc(p.id)}" style="--sw:${c.fuerte};--sw2:${c.fondo}">
                <i aria-hidden="true"></i>${esc(p.nombre)}</button>`;
        }).join('') || '<p class="adm-empty">No hay productos con esa búsqueda.</p>';
    }

    function swatchesHtml() {
        const flavors = window.YOGUR_FLAVORS || [];
        return flavors.map((f) => {
            const c = brandColors({ slug: f.slug, nombre: f.nombre });
            return `<button type="button" class="adm-pair" data-pair="${c.fondo},${c.fuerte}" title="${esc(f.nombre)}: ${c.fondo} y ${c.fuerte}">
                <span style="background:${c.fondo}"></span><span style="background:${c.fuerte}"></span>
                <small>${esc(f.nombre)}</small></button>`;
        }).join('');
    }

    function fieldHtml(key, label, help) {
        return `
            <div class="adm-cfield">
                <label class="adm-cswatch" style="--c:${draft[key]}">
                    <input type="color" id="c-${key}" value="${draft[key].toLowerCase()}" aria-label="${esc(label)}">
                </label>
                <div class="adm-cfield-txt">
                    <label for="c-${key}-hex">${esc(label)}</label>
                    <small>${esc(help)}</small>
                </div>
                <input type="text" class="adm-hex" id="c-${key}-hex" value="${draft[key]}" maxlength="7" spellcheck="false" autocomplete="off" aria-label="${esc(label)} en hexadecimal">
            </div>`;
    }

    function originNote(p) {
        const c = colorsFor(p);
        const parts = [];
        if (c.fuerteOrigen === 'navegador') {
            parts.push('El color fuerte de este producto está guardado solo en este navegador: la base aún no recibe ese campo.');
        }
        if (flavorOf(p)) {
            parts.push('Por ahora la tienda pinta los 8 sabores con los colores de la marca; lo que guardes aquí queda listo para cuando la tienda lea estos colores.');
        }
        return parts.map((t) => `<p class="adm-note">${esc(t)}</p>`).join('');
    }

    function renderEditor() {
        const host = $('color-editor');
        const p = current();
        if (!p) {
            host.innerHTML = '<p class="adm-empty">Cuando haya productos, aquí eliges sus colores.</p>';
            return;
        }
        const ratio = contrast(draft.fuerte, inkOn(draft.fuerte));
        host.innerHTML = `
            <div class="adm-color-head">
                <h2>${esc(p.nombre)}</h2>
                <p>Dos colores por producto: el claro para la tarjeta y el fuerte para la ficha.</p>
            </div>
            ${fieldHtml('fondo', 'Fondo claro', 'Tarjeta del catálogo y lado de la foto en la ficha')}
            ${fieldHtml('fuerte', 'Color fuerte', 'Nombre, precio y botón de la ficha')}
            <p class="adm-contrast${ratio < 4.5 ? ' is-low' : ''}" id="c-contrast">
                Texto ${inkOn(draft.fuerte) === '#FFFFFF' ? 'blanco' : 'oscuro'} sobre el color fuerte: contraste ${ratio.toFixed(1)}:1 ${ratio < 4.5 ? '· difícil de leer, prueba un tono más oscuro' : '· se lee bien'}
            </p>
            <div class="adm-pairs">
                <p class="adm-kicker">Paleta de la marca</p>
                <div class="adm-pairs-row">${swatchesHtml()}</div>
            </div>
            <div class="adm-color-actions">
                <button type="button" class="adm-btn adm-btn--red" id="c-save">Guardar colores</button>
                <button type="button" class="adm-btn" id="c-reset">Volver a los de la marca</button>
            </div>
            ${originNote(p)}`;

        ['fondo', 'fuerte'].forEach((key) => {
            const picker = $(`c-${key}`);
            const hex = $(`c-${key}-hex`);
            picker.addEventListener('input', () => setColor(key, picker.value, { from: 'picker' }));
            hex.addEventListener('input', () => {
                let v = hex.value.trim();
                if (v && v[0] !== '#') v = `#${v}`;
                if (isHex(v)) setColor(key, v, { from: 'hex' });
            });
            hex.addEventListener('blur', () => { hex.value = draft[key]; });
        });
        host.querySelectorAll('[data-pair]').forEach((b) => b.addEventListener('click', () => {
            const [fondo, fuerte] = b.dataset.pair.split(',');
            setColor('fondo', fondo);
            setColor('fuerte', fuerte);
        }));
        $('c-save').addEventListener('click', save);
        $('c-reset').addEventListener('click', () => {
            const b = brandColors(p);
            setColor('fondo', b.fondo);
            setColor('fuerte', b.fuerte);
        });
    }

    function setColor(key, value, { from } = {}) {
        draft[key] = value.toUpperCase();
        const picker = $(`c-${key}`);
        const hex = $(`c-${key}-hex`);
        if (picker && from !== 'picker') picker.value = draft[key].toLowerCase();
        if (hex && from !== 'hex') hex.value = draft[key];
        picker?.closest('.adm-cswatch')?.style.setProperty('--c', draft[key]);
        const ratio = contrast(draft.fuerte, inkOn(draft.fuerte));
        const cEl = $('c-contrast');
        if (cEl) {
            cEl.classList.toggle('is-low', ratio < 4.5);
            cEl.textContent = `Texto ${inkOn(draft.fuerte) === '#FFFFFF' ? 'blanco' : 'oscuro'} sobre el color fuerte: contraste ${ratio.toFixed(1)}:1 ${ratio < 4.5 ? '· difícil de leer, prueba un tono más oscuro' : '· se lee bien'}`;
        }
        const chip = document.querySelector(`[data-color-id="${currentId}"]`);
        chip?.style.setProperty('--sw', draft.fuerte);
        chip?.style.setProperty('--sw2', draft.fondo);
        renderPreviews();
    }

    function renderPreviews() {
        const p = current();
        const ficha = $('color-preview-ficha');
        const card = $('color-preview-card');
        if (!p) {
            ficha.innerHTML = '';
            card.innerHTML = '';
            return;
        }
        const photo = photoFor(p);
        const off = Number(p.descuento || 0);
        const ink = inkOn(draft.fuerte);
        ficha.style.setProperty('--f', draft.fuerte);
        ficha.style.setProperty('--f-ink', ink);
        ficha.style.setProperty('--f-soft', draft.fondo);
        ficha.classList.toggle('is-dark-ink', ink !== '#FFFFFF');
        ficha.innerHTML = `
            <span class="adm-kicker adm-kicker--on">Vista previa · ficha</span>
            <header class="adm-feature-head">
                <div><span class="adm-feature-cat">${esc(p.categoria || 'Yogur')}</span><h2>${esc(p.nombre)}</h2></div>
                <div class="adm-price adm-price--big"><small>${esc(p.volumen || '500 ml')}</small>${off ? `<s>${cop(p.precio)}</s>` : ''}<strong>${cop(salePrice(p))}</strong></div>
            </header>
            <figure class="adm-feature-fig adm-feature-fig--soft">${photo ? `<img src="${esc(photo)}" alt="" onerror="this.hidden=true">` : ''}</figure>
            <p class="adm-preview-desc">${esc(p.descripcion_corta || p.descripcion || 'Yogurt artesanal de 500 ml.')}</p>
            <span class="adm-feature-cta is-static">Agregar al carrito</span>`;
        card.style.setProperty('--soft', draft.fondo);
        card.style.setProperty('--strong', draft.fuerte);
        card.innerHTML = `
            <div class="adm-shop-media">${photo ? `<img src="${esc(photo)}" alt="" onerror="this.hidden=true">` : ''}</div>
            <div class="adm-shop-info">
                <strong>${esc(p.nombre)}</strong>
                <span>${off ? `<s>${cop(p.precio)}</s> ` : ''}${cop(salePrice(p))}</span>
                <em>Agregar al carrito</em>
            </div>`;
    }

    async function save() {
        const p = current();
        if (!p) return;
        const btn = $('c-save');
        btn.disabled = true;
        btn.textContent = 'Guardando…';
        const res = await ctx.updateProduct(p.id, { color_fondo: draft.fondo, color_acento: draft.fuerte });
        btn.disabled = false;
        btn.textContent = 'Guardar colores';
        if (!res.success) {
            ctx.toast(res.message || 'No se pudieron guardar los colores', 'error');
            return;
        }
        const fuerteEnBase = String(res.product?.color_acento || '').toUpperCase() === draft.fuerte;
        if (fuerteEnBase) writeLocalColor(p.id, null);
        else writeLocalColor(p.id, { fuerte: draft.fuerte });
        ctx.toast(fuerteEnBase
            ? `Colores de ${p.nombre} guardados`
            : `Fondo guardado. El color fuerte quedó en este navegador por ahora`, fuerteEnBase ? 'success' : 'info');
        draft = null;
        await ctx.reloadProducts();
    }

    function render() {
        ensureCurrent();
        renderChips();
        renderEditor();
        renderPreviews();
    }

    $('color-products').addEventListener('click', (e) => {
        const b = e.target.closest('[data-color-id]');
        if (!b) return;
        select(Number(b.dataset.colorId));
    });

    function select(id) {
        currentId = id;
        draft = null;
        if (document.body.dataset.view === 'colores') render();
    }

    return {
        open: render,
        render,
        refresh: () => { draft = null; if (document.body.dataset.view === 'colores') render(); },
        select
    };
}
