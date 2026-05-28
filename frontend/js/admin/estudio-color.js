/**
 * admin/estudio-color.js — Estudio de producto en vivo: un solo color → pastel automático, vista previa de la tarjeta,
 * calculadora de descuento y estilo del letrero.
 */
import { imgSrc, FLAVOR_PALETTES, DARK_TONE_NAMES } from './constants.js';
import { formatCOP } from './ui.js';
import { calcularSlugProducto } from './formulario.js';

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** Mezcla dos colores hexadecimales con peso w para el primero */
export function mixAdminHex(hexA, hexB, weightA) {
    const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const a = rgb(HEX.test(hexA) ? hexA : '#C3343E');
    const b = rgb(HEX.test(hexB) ? hexB : '#FFFFFF');
    const canal = (i) => Math.round(a[i] * weightA + b[i] * (1 - weightA)).toString(16).padStart(2, '0');
    return ('#' + canal(0) + canal(1) + canal(2)).toUpperCase();
}

/** Pastel de la tarjeta: 22 % del color + 78 % blanco (igual que la web). */
export function colorClaro(hex) {
    return mixAdminHex(hex, '#FFFFFF', 0.22);
}

/** Color fuerte elegido en el formulario (fresa si está vacío o mal escrito). */
export function colorElegido() {
    const v = (document.getElementById('p-color-dark')?.value || '').trim();
    return HEX.test(v) ? v.toUpperCase() : '#C3343E';
}

/** Sincroniza la tarjeta de vista previa en vivo con el formulario */
export function syncLiveCardPreview() {
    const card = document.getElementById('adminLiveCard');
    if (!card) return;

    const nombre = document.getElementById('p-nombre')?.value.trim() || 'Nombre del yogur';
    const precio = Number(document.getElementById('p-precio')?.value || 0);
    const precio1L = Number(document.getElementById('p-precio-1l')?.value || 0) || (precio ? Math.round((precio * 1.75) / 100) * 100 : 0);
    const desc = Number(document.getElementById('p-descuento')?.value || 0);
    const catSelect = document.getElementById('p-categoria');
    const catText = catSelect ? (catSelect.options[catSelect.selectedIndex]?.text || 'Frutales') : 'Frutales';
    const colorDark = colorElegido();
    const colorLight = colorClaro(colorDark);
    const colorFloor = mixAdminHex(colorDark, '#000000', 0.8);

    const tipo = document.getElementById('p-letrero-tipo')?.value || '';
    const texto = document.getElementById('p-letrero')?.value.trim() || '';
    const badgeColor = document.getElementById('p-color-acento')?.value || '#D62300';
    const badgeShape = document.getElementById('p-letrero-forma')?.value || 'pill';
    const imgVal = document.getElementById('p-imagen')?.value || '';

    // Muestra del pastel automático y nombre del color
    const claro = document.getElementById('adminColorClaro');
    if (claro) claro.style.background = colorLight;
    const claroHex = document.getElementById('adminColorClaroHex');
    if (claroHex) claroHex.textContent = colorLight;
    const dotIcon = document.getElementById('adminColorDotIcon');
    if (dotIcon) dotIcon.style.color = colorDark;
    const nombreColor = document.getElementById('adminDarkColorName');
    if (nombreColor) nombreColor.textContent = DARK_TONE_NAMES[colorDark.toLowerCase()] || 'Personalizado';
    const hexInput = document.getElementById('p-color-dark-text');
    if (hexInput && hexInput !== document.activeElement) hexInput.value = colorDark;
    document.querySelectorAll('#adminPaletteDarkDots .admin-color-dot').forEach((btn) => {
        btn.classList.toggle('is-active', (btn.dataset.color || '').toLowerCase() === colorDark.toLowerCase());
    });

    // Fondo detrás de la tarjeta
    const previewWrap = document.getElementById('adminCardPreviewWrap');
    if (previewWrap) previewWrap.style.background = `linear-gradient(155deg, ${colorDark} 0%, ${colorFloor} 100%)`;

    // Título, categoría y colores de la tarjeta
    const titleEl = document.getElementById('adminLiveTitle');
    if (titleEl) {
        titleEl.textContent = nombre;
        titleEl.style.color = colorFloor;
    }
    const catEl = document.getElementById('adminLiveCat');
    if (catEl) catEl.textContent = catText;
    card.style.setProperty('--producto-card-bg', colorLight);
    card.style.setProperty('--hp-c', colorLight);
    card.style.setProperty('--flavor-dark', colorDark);
    card.style.setProperty('--flavor-light', colorLight);

    // Imagen de la botella (la subida, o la del sabor si todavía no hay)
    const bottleImg = document.getElementById('adminLiveBottle');
    if (bottleImg) {
        const porDefecto = 'assets/products/yoguraso-fresa-500ml-sm.webp';
        bottleImg.src = imgVal.startsWith('data:') ? imgVal : imgSrc(imgVal || porDefecto);
    }

    // Letrero promocional
    const badgeEl = document.getElementById('adminLiveBadge');
    if (badgeEl) {
        let badgeText = texto;
        if (!badgeText && tipo) {
            if (tipo === 'nuevo') badgeText = 'NUEVO';
            else if (tipo === 'oferta') badgeText = '¡OFERTA!';
            else if (tipo === 'descuento' && desc > 0) badgeText = `-${desc}%`;
            else badgeText = tipo.toUpperCase();
        } else if (!badgeText && desc > 0) {
            badgeText = `-${desc}%`;
        }

        if (badgeText) {
            badgeEl.style.display = 'inline-block';
            badgeEl.textContent = badgeText;
            badgeEl.style.backgroundColor = badgeColor;
            badgeEl.style.borderRadius = badgeShape === 'rounded' ? '6px' : (badgeShape === 'flag' ? '4px 12px 12px 4px' : '999px');
        } else {
            badgeEl.style.display = 'none';
            badgeEl.textContent = '';
        }
    }

    // Precio con descuento (500 ml o 1 litro)
    const priceEl = document.getElementById('adminLivePrice');
    if (priceEl) {
        const is1L = document.getElementById('preview-size-1L')?.classList.contains('is-active');
        const activeBase = is1L ? precio1L : precio;
        const finalP = desc > 0 ? Math.max(500, Math.round((activeBase * (1 - desc / 100)) / 100) * 100) : activeBase;
        priceEl.innerHTML = desc > 0
            ? `<span class="yg-price"><s>${formatCOP(activeBase)}</s> ${formatCOP(finalP)}</span>`
            : `<span class="yg-price">${formatCOP(finalP)}</span>`;
    }
}

/** Calculadora bidireccional de descuento (% <-> Precio final) */
export function updateDiscountCalculator(source = 'percent') {
    const basePrice = Number(document.getElementById('p-precio')?.value || 0);
    const descInput = document.getElementById('p-descuento');
    const finalInput = document.getElementById('p-precio-final-input');
    const tipo = document.getElementById('p-letrero-tipo')?.value || '';
    const textoInput = document.getElementById('p-letrero');

    let pct = 0;
    let finalPrice = basePrice;
    let savings = 0;

    if (source === 'percent') {
        pct = Math.max(0, Math.min(80, Math.round(Number(descInput?.value || 0))));
        if (descInput && Number(descInput.value) !== pct) descInput.value = String(pct);
        savings = pct > 0 ? Math.round((basePrice * (pct / 100)) / 100) * 100 : 0;
        finalPrice = Math.max(0, basePrice - savings);
        if (finalInput) finalInput.value = pct > 0 ? String(finalPrice) : '';
    } else if (source === 'final') {
        finalPrice = Number(finalInput?.value || 0);
        if (basePrice > 0 && finalPrice > 0 && finalPrice < basePrice) {
            pct = Math.max(0, Math.min(80, Math.round(((basePrice - finalPrice) / basePrice) * 100)));
            savings = basePrice - finalPrice;
        } else {
            finalPrice = basePrice;
        }
        if (descInput) descInput.value = String(pct);
    }

    if (tipo === 'descuento' && textoInput) {
        if (pct > 0 && (!textoInput.value.trim() || /^-\d+%$/.test(textoInput.value.trim()))) {
            textoInput.value = `-${pct}%`;
        } else if (pct === 0 && /^-\d+%$/.test(textoInput.value.trim())) {
            textoInput.value = '';
        }
    }

    const sumBase = document.getElementById('calcBasePrice');
    const sumSave = document.getElementById('calcSaveAmount');
    const sumFinal = document.getElementById('calcFinalPrice');

    if (sumBase) sumBase.textContent = formatCOP(basePrice);
    if (sumSave) sumSave.textContent = `${formatCOP(savings)} (${pct}%)`;
    if (sumFinal) sumFinal.textContent = formatCOP(finalPrice);

    syncLiveCardPreview();
}

export function setLetreroType(type, { shouldFocus = false } = {}) {
    document.querySelectorAll('#adminBadgeTypePills .admin-type-pill').forEach((b) => {
        b.classList.toggle('is-active', (b.dataset.type || '') === (type || ''));
    });

    const tipoInput = document.getElementById('p-letrero-tipo');
    if (tipoInput) tipoInput.value = type || '';

    const textoInput = document.getElementById('p-letrero');
    const descInput = document.getElementById('p-descuento');
    const discountBox = document.getElementById('adminDiscountBox');
    const stylingRow = document.getElementById('adminBadgeStylingRow');
    const textWrap = document.getElementById('adminLetreroTextWrap');

    // Mostrar/ocultar controles según el tipo elegido para mantener el formulario limpio
    const showBadgeControls = Boolean(type);
    const showDiscount = type === 'descuento' || type === 'oferta';
    if (stylingRow) stylingRow.hidden = !showBadgeControls;
    if (textWrap) textWrap.hidden = !showBadgeControls;
    if (discountBox) discountBox.hidden = !showDiscount;

    if (!type) {
        if (textoInput) textoInput.value = '';
        if (descInput) descInput.value = '0';
        updateDiscountCalculator('percent');
    } else if (type === 'nuevo') {
        if (textoInput) textoInput.value = 'NUEVO';
        if (descInput) descInput.value = '0';
        setBadgeColorActive('#2A9D60');
        updateDiscountCalculator('percent');
    } else if (type === 'oferta') {
        if (textoInput && (!textoInput.value || textoInput.value === 'NUEVO')) {
            textoInput.value = '¡OFERTA!';
        }
        setBadgeColorActive('#E68A00');
        syncLiveCardPreview();
    } else if (type === 'descuento') {
        setBadgeColorActive('#D62300');
        if (descInput && Number(descInput.value) <= 0) {
            descInput.value = '10';
        }
        updateDiscountCalculator('percent');
    } else if (type === 'personalizado') {
        if (textoInput && (textoInput.value === 'NUEVO' || textoInput.value === '¡OFERTA!' || /^-\d+%$/.test(textoInput.value))) {
            textoInput.value = '';
        }
        if (descInput) descInput.value = '0';
        if (shouldFocus) textoInput?.focus();
        syncLiveCardPreview();
    }
}

export function setBadgeColorActive(colorHex) {
    const acentoInput = document.getElementById('p-color-acento');
    if (acentoInput) acentoInput.value = colorHex;
    const picker = document.getElementById('p-letrero-color-picker');
    if (picker) picker.value = colorHex;
    document.querySelectorAll('#adminBadgeColors .badge-color-dot').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.color?.toLowerCase() === colorHex.toLowerCase());
    });
}

export function initAdminStudioEvents() {
    const inputsToWatch = ['p-nombre', 'p-precio', 'p-precio-1l', 'p-stock', 'p-categoria', 'p-letrero', 'p-letrero-tipo'];
    inputsToWatch.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const handler = () => {
            if (id === 'p-precio') updateDiscountCalculator('percent');
            else syncLiveCardPreview();
        };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    });

    const descInput = document.getElementById('p-descuento');
    descInput?.addEventListener('input', () => updateDiscountCalculator('percent'));
    descInput?.addEventListener('change', () => updateDiscountCalculator('percent'));

    const finalInput = document.getElementById('p-precio-final-input');
    finalInput?.addEventListener('input', () => updateDiscountCalculator('final'));
    finalInput?.addEventListener('change', () => updateDiscountCalculator('final'));

    document.querySelectorAll('.quick-pct-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (!descInput) return;
            descInput.value = String(Number(btn.dataset.pct || 0));
            const tipoInput = document.getElementById('p-letrero-tipo');
            if (tipoInput && (!tipoInput.value || tipoInput.value === 'nuevo')) setLetreroType('descuento');
            updateDiscountCalculator('percent');
        });
    });

    document.querySelectorAll('#adminBadgeTypePills .admin-type-pill').forEach((btn) => {
        btn.addEventListener('click', () => setLetreroType(btn.dataset.type, { shouldFocus: true }));
    });

    document.querySelectorAll('#adminShapePills .shape-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#adminShapePills .shape-pill').forEach((b) => b.classList.toggle('is-active', b === btn));
            const shapeInput = document.getElementById('p-letrero-forma');
            if (shapeInput) shapeInput.value = btn.dataset.shape || 'pill';
            syncLiveCardPreview();
        });
    });

    document.querySelectorAll('#adminBadgeColors .badge-color-dot').forEach((btn) => {
        btn.addEventListener('click', () => {
            setBadgeColorActive(btn.dataset.color || '#D62300');
            syncLiveCardPreview();
        });
    });

    document.getElementById('p-letrero-color-picker')?.addEventListener('input', (e) => {
        setBadgeColorActive(e.target.value);
        syncLiveCardPreview();
    });

    // Un solo color: el selector, la paleta rápida o el código hexadecimal. El pastel sale solo.
    const aplicarColor = (valor) => {
        let hex = String(valor || '').trim();
        if (hex && !hex.startsWith('#')) hex = '#' + hex;
        if (!HEX.test(hex)) return;
        const picker = document.getElementById('p-color-dark');
        if (picker) picker.value = hex;
        syncLiveCardPreview();
    };
    document.querySelectorAll('#adminPaletteDarkDots .admin-color-dot').forEach((btn) => {
        btn.addEventListener('click', () => {
            const hexInput = document.getElementById('p-color-dark-text');
            if (hexInput) hexInput.value = btn.dataset.color;
            aplicarColor(btn.dataset.color);
        });
    });
    const picker = document.getElementById('p-color-dark');
    // algunos navegadores avisan solo con 'change' al cerrar el selector; se escuchan los dos
    ['input', 'change'].forEach((ev) => picker?.addEventListener(ev, (e) => {
        const hexInput = document.getElementById('p-color-dark-text');
        if (hexInput) hexInput.value = e.target.value.toUpperCase();
        aplicarColor(e.target.value);
    }));
    document.getElementById('p-color-dark-text')?.addEventListener('input', (e) => aplicarColor(e.target.value));

    const btn500 = document.getElementById('preview-size-500');
    const btn1L = document.getElementById('preview-size-1L');
    if (btn500 && btn1L) {
        [[btn500, btn1L], [btn1L, btn500]].forEach(([on, off]) => on.addEventListener('click', (e) => {
            e.preventDefault();
            on.classList.add('is-active');
            off.classList.remove('is-active');
            syncLiveCardPreview();
        }));
    }
}
