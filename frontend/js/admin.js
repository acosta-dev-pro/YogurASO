/**
 * admin.js — Aquí queda el panel: inventario de yogures y lista de usuarios.
 * Solo entra quien la base reconoce como admin.
 */
import { fetchProducts, createProduct, updateProduct, deleteProduct, permanentlyDeleteProduct, uploadImage, fetchUsers, toggleUserActive, verifyAdmin, syncSession } from './api.js';

/** Las fotos del catálogo se guardan como "assets/..."; desde /pages/ hay que subir un nivel. */
function imgSrc(url) {
    const s = String(url || '');
    if (!s || /^(https?:|data:|blob:|\/|\.\.\/)/i.test(s)) return s;
    return `../${s.replace(/^\.\//, '')}`;
}

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

let editandoId = null;
let allAdminProducts = [];
let allAdminQuestions = [];
let guardando = false;
let sortKey = 'id';
let sortDir = 'asc';
const selectedIds = new Set();

const escapeHtml = (v) => window.YogurUtils?.escapeHtml(v) || String(v ?? '');
const toast = (msg, type = 'success') => window.YogurUtils?.showToast?.(msg, type);
const confirmAction = (opts) => window.YogurUtils?.confirmAction?.(opts);
const formatCOP = (n) => window.YogurUtils?.formatCOP?.(n) || ('$' + Number(n || 0).toLocaleString('es-CO'));

function getToken() {
    return localStorage.getItem('token');
}

function getUsuario() {
    try {
        return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
        return null;
    }
}

function setSubmitLabel(isEdit) {
    const btn = document.getElementById('btn-guardar-producto');
    if (btn) btn.textContent = isEdit ? 'Guardar cambios' : 'Crear producto';
}

function abrirModal(titulo, { isEdit = false } = {}) {
    const modal = document.getElementById('modal-producto');
    const title = document.getElementById('modal-title');
    const hint = document.getElementById('modal-hint');
    const eyebrow = document.getElementById('modal-eyebrow');
    if (title) title.textContent = titulo;
    if (eyebrow) eyebrow.textContent = isEdit ? 'Edición' : 'Alta';
    if (hint) {
        hint.textContent = isEdit
            ? 'Actualiza precio, stock, imagen o visibilidad del producto.'
            : 'Completa los datos del yogur para publicarlo en el catálogo.';
    }
    setSubmitLabel(isEdit);
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        const fieldsScroll = document.querySelector('.admin-studio-fields');
        if (fieldsScroll) fieldsScroll.scrollTop = 0;
        const asideScroll = document.querySelector('.admin-studio-aside');
        if (asideScroll) asideScroll.scrollTop = 0;
        setTimeout(() => {
            const fieldsScroll2 = document.querySelector('.admin-studio-fields');
            if (fieldsScroll2) fieldsScroll2.scrollTop = 0;
            document.getElementById('p-nombre')?.focus();
        }, 40);
        syncLiveCardPreview();
    }
}

function cerrarModal({ reset = true } = {}) {
    const modal = document.getElementById('modal-producto');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
    if (reset) limpiarFormulario();
}


/* ==========================================================================
   SINCRONIZACIÓN EN TIEMPO REAL: Tarjeta en Vivo, Letreros y Calculadora
   ========================================================================== */

const TONE_NAMES = {
    '#fff8f4': 'Crema suave',
    '#ffe6ea': 'Fresa pastel',
    '#fff5d6': 'Piña oro miel',
    '#f4e7f0': 'Mora silvestre',
    '#feece0': 'Melocotón dulce',
    '#eaf5e4': 'Guanábana fresca',
    '#fef2df': 'Mango maduro',
    '#f2eae5': 'Café huilense'
};

function syncLiveCardPreview() {
    const card = document.getElementById('adminLiveCard');
    if (!card) return;

    const nombre = document.getElementById('p-nombre')?.value.trim() || 'Nombre del yogur';
    const precio = Number(document.getElementById('p-precio')?.value || 0);
    const precio1L = Number(document.getElementById('p-precio-1l')?.value || 0) || (precio ? Math.round((precio * 1.75) / 100) * 100 : 0);
    const desc = Number(document.getElementById('p-descuento')?.value || 0);
    const catSelect = document.getElementById('p-categoria');
    const catText = catSelect ? (catSelect.options[catSelect.selectedIndex]?.text || 'Natural') : 'Natural';
    const colorHex = (document.getElementById('p-color-fondo')?.value || '#FFF8F4').trim();
    const tipo = document.getElementById('p-letrero-tipo')?.value || '';
    const texto = document.getElementById('p-letrero')?.value.trim() || '';
    const badgeColor = document.getElementById('p-color-acento')?.value || '#D62300';
    const badgeShape = document.getElementById('p-letrero-forma')?.value || 'pill';
    const imgVal = document.getElementById('p-imagen')?.value || '';

    // 1. Título y categoría
    const titleEl = document.getElementById('adminLiveTitle');
    if (titleEl) titleEl.textContent = nombre;
    const catEl = document.getElementById('adminLiveCat');
    if (catEl) catEl.textContent = catText;

    // 2. Fondo de la tarjeta y código hex editable
    card.style.setProperty('--producto-card-bg', colorHex);
    card.style.setProperty('--hp-c', colorHex);
    card.style.backgroundColor = colorHex;

    const hexInput = document.getElementById('p-color-fondo-text');
    if (hexInput && hexInput !== document.activeElement) {
        hexInput.value = colorHex.toUpperCase();
    }
    const toneNameEl = document.getElementById('adminColorName');
    if (toneNameEl) {
        toneNameEl.textContent = TONE_NAMES[colorHex.toLowerCase()] || 'Personalizado';
    }

    // Pastillas de paleta activas
    document.querySelectorAll('#adminPalettePills .palette-pill').forEach((btn) => {
        btn.classList.toggle('is-active', (btn.dataset.color || '').toLowerCase() === colorHex.toLowerCase());
    });

    // 3. Imagen de la botella (sobresaliendo de la tarjeta con efecto 3D)
    const bottleImg = document.getElementById('adminLiveBottle');
    if (bottleImg) {
        if (imgVal) {
            bottleImg.src = imgSrc(imgVal);
        } else {
            const clean = String(nombre).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const foundFlavor = (window.YOGUR_FLAVORS || []).find((f) => clean.includes(f.slug) || clean.includes(f.nombre.toLowerCase()));
            if (foundFlavor) bottleImg.src = `../assets/products/yoguraso-${foundFlavor.slug}-500ml-sm.webp`;
            else bottleImg.src = '../assets/products/yoguraso-fresa-500ml-sm.webp';
        }
    }

    // 4. Letrero / Etiqueta interactiva en vivo
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

    // 5. Precios con cálculo de descuento en vivo
    const priceEl = document.getElementById('adminLivePrice');
    if (priceEl) {
        const is1L = document.getElementById('preview-size-1L')?.classList.contains('is-active');
        const activeBase = is1L ? precio1L : precio;
        const finalP = desc > 0 ? Math.round((activeBase * (1 - desc / 100)) / 100) * 100 : activeBase;
        if (desc > 0) {
            priceEl.innerHTML = `<span class="yg-price"><s>${formatCOP(activeBase)}</s> ${formatCOP(finalP)}</span>`;
        } else {
            priceEl.innerHTML = `<span class="yg-price">${formatCOP(finalP)}</span>`;
        }
    }
}

/**
 * Calculadora interactiva de descuento en tiempo real:
 * Calcula el ahorro en pesos y el precio final a partir del porcentaje,
 * o calcula el porcentaje a partir del precio final deseado.
 */
function updateDiscountCalculator(source = 'percent') {
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
            pct = 0;
            savings = 0;
            finalPrice = basePrice;
        }
        if (descInput) descInput.value = String(pct);
    }

    // Auto-actualizar texto de letrero si es tipo descuento
    if (tipo === 'descuento' && textoInput) {
        if (pct > 0 && (!textoInput.value.trim() || /^-\d+%$/.test(textoInput.value.trim()))) {
            textoInput.value = `-${pct}%`;
        } else if (pct === 0 && /^-\d+%$/.test(textoInput.value.trim())) {
            textoInput.value = '';
        }
    }

    // Resumen visual
    const sumBase = document.getElementById('calcBasePrice');
    const sumSave = document.getElementById('calcSaveAmount');
    const sumFinal = document.getElementById('calcFinalPrice');

    if (sumBase) sumBase.textContent = formatCOP(basePrice);
    if (sumSave) sumSave.textContent = `${formatCOP(savings)} (${pct}%)`;
    if (sumFinal) sumFinal.textContent = formatCOP(finalPrice);

    syncLiveCardPreview();
}

function initAdminStudioEvents() {
    const inputsToWatch = ['p-nombre', 'p-precio', 'p-precio-1l', 'p-stock', 'p-categoria', 'p-letrero', 'p-letrero-tipo'];
    inputsToWatch.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                if (id === 'p-precio') updateDiscountCalculator('percent');
                else syncLiveCardPreview();
            });
            el.addEventListener('change', () => {
                if (id === 'p-precio') updateDiscountCalculator('percent');
                else syncLiveCardPreview();
            });
        }
    });

    // Eventos de la calculadora de descuento
    const descInput = document.getElementById('p-descuento');
    descInput?.addEventListener('input', () => updateDiscountCalculator('percent'));
    descInput?.addEventListener('change', () => updateDiscountCalculator('percent'));

    const finalInput = document.getElementById('p-precio-final-input');
    finalInput?.addEventListener('input', () => updateDiscountCalculator('final'));
    finalInput?.addEventListener('change', () => updateDiscountCalculator('final'));

    // Botones rápidos de porcentaje (10%, 15%, 20%, 30%)
    document.querySelectorAll('.quick-pct-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const pct = Number(btn.dataset.pct || 0);
            if (descInput) {
                descInput.value = String(pct);
                // Si no hay tipo seleccionado, activar tipo descuento
                const tipoInput = document.getElementById('p-letrero-tipo');
                if (tipoInput && (!tipoInput.value || tipoInput.value === 'nuevo')) {
                    setLetreroType('descuento');
                }
                updateDiscountCalculator('percent');
            }
        });
    });

    // Selector de Tipo de Letrero (Píldoras)
    document.querySelectorAll('#adminBadgeTypePills .admin-type-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            setLetreroType(btn.dataset.type, { shouldFocus: true });
        });
    });

    // Selector de Forma de Letrero (Píldora, Etiqueta, Banderín)
    document.querySelectorAll('#adminShapePills .shape-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#adminShapePills .shape-pill').forEach((b) => b.classList.toggle('is-active', b === btn));
            const shapeInput = document.getElementById('p-letrero-forma');
            if (shapeInput) shapeInput.value = btn.dataset.shape || 'pill';
            syncLiveCardPreview();
        });
    });

    // Selector de Color del Letrero (Puntos de color y color picker)
    document.querySelectorAll('#adminBadgeColors .badge-color-dot').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#adminBadgeColors .badge-color-dot').forEach((b) => b.classList.toggle('is-active', b === btn));
            const color = btn.dataset.color || '#D62300';
            const acentoInput = document.getElementById('p-color-acento');
            if (acentoInput) acentoInput.value = color;
            const picker = document.getElementById('p-letrero-color-picker');
            if (picker) picker.value = color;
            syncLiveCardPreview();
        });
    });

    const badgeColorPicker = document.getElementById('p-letrero-color-picker');
    badgeColorPicker?.addEventListener('input', (e) => {
        const color = e.target.value;
        const acentoInput = document.getElementById('p-color-acento');
        if (acentoInput) acentoInput.value = color;
        document.querySelectorAll('#adminBadgeColors .badge-color-dot').forEach((b) => {
            b.classList.toggle('is-active', b.dataset.color?.toLowerCase() === color.toLowerCase());
        });
        syncLiveCardPreview();
    });

    // Paleta de colores predefinida de la tarjeta
    document.querySelectorAll('#adminPalettePills .palette-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;
            const input = document.getElementById('p-color-fondo');
            const textInput = document.getElementById('p-color-fondo-text');
            if (input && color) {
                input.value = color;
                if (textInput) textInput.value = color.toUpperCase();
                syncLiveCardPreview();
            }
        });
    });

    // Color picker y campo de texto hex editable
    const colorPicker = document.getElementById('p-color-fondo');
    const colorHexInput = document.getElementById('p-color-fondo-text');

    colorPicker?.addEventListener('input', (e) => {
        if (colorHexInput) colorHexInput.value = e.target.value.toUpperCase();
        syncLiveCardPreview();
    });

    colorHexInput?.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            if (colorPicker) colorPicker.value = val;
            syncLiveCardPreview();
        }
    });

    // Alternador de presentación 500 ml vs 1 L en la tarjeta de vista previa
    const btn500 = document.getElementById('preview-size-500');
    const btn1L = document.getElementById('preview-size-1L');
    if (btn500 && btn1L) {
        btn500.addEventListener('click', (e) => {
            e.preventDefault();
            btn500.classList.add('is-active');
            btn1L.classList.remove('is-active');
            syncLiveCardPreview();
        });
        btn1L.addEventListener('click', (e) => {
            e.preventDefault();
            btn1L.classList.add('is-active');
            btn500.classList.remove('is-active');
            syncLiveCardPreview();
        });
    }
}

function setLetreroType(type, { shouldFocus = false } = {}) {
    document.querySelectorAll('#adminBadgeTypePills .admin-type-pill').forEach((b) => {
        b.classList.toggle('is-active', (b.dataset.type || '') === (type || ''));
    });

    const tipoInput = document.getElementById('p-letrero-tipo');
    if (tipoInput) tipoInput.value = type || '';

    const textoInput = document.getElementById('p-letrero');
    const descInput = document.getElementById('p-descuento');
    const acentoInput = document.getElementById('p-color-acento');

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
        if (shouldFocus) textoInput?.focus();
        syncLiveCardPreview();
    }
}

function setBadgeColorActive(colorHex) {
    const acentoInput = document.getElementById('p-color-acento');
    if (acentoInput) acentoInput.value = colorHex;
    const picker = document.getElementById('p-letrero-color-picker');
    if (picker) picker.value = colorHex;
    document.querySelectorAll('#adminBadgeColors .badge-color-dot').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.color?.toLowerCase() === colorHex.toLowerCase());
    });
}

function limpiarFormulario() {
    editandoId = null;
    guardando = false;
    const form = document.getElementById('form-producto');
    form?.reset();
    const idInput = document.getElementById('p-id');
    if (idInput) idInput.value = '';
    const activo = document.getElementById('p-activo');
    if (activo) { if (activo.type === 'checkbox') activo.checked = true; else activo.value = 'true'; }
    const categoria = document.getElementById('p-categoria');
    if (categoria) categoria.value = 'natural';
    const colorFondo = document.getElementById('p-color-fondo');
    if (colorFondo) colorFondo.value = '#FFF8F4';
    const colorHexInput = document.getElementById('p-color-fondo-text');
    if (colorHexInput) colorHexInput.value = '#FFF8F4';

    setLetreroType('');
    setBadgeColorActive('#D62300');

    const shapePills = document.querySelectorAll('#adminShapePills .shape-pill');
    shapePills.forEach((p, idx) => p.classList.toggle('is-active', idx === 0));
    const shapeInput = document.getElementById('p-letrero-forma');
    if (shapeInput) shapeInput.value = 'pill';

    resetImageUpload();
    setSubmitLabel(false);
    updateDiscountCalculator('percent');
    syncLiveCardPreview();
}

function formatAdminCOP(n) {
    return window.YogurUtils?.formatCOP?.(n) || `$${Number(n || 0).toLocaleString('es-CO')}`;
}

function resetImageUpload() {
    const placeholder = document.getElementById('image-upload-placeholder');
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('image-remove-btn');
    const fileInput = document.getElementById('p-imagen-file');
    const hiddenInput = document.getElementById('p-imagen');
    if (placeholder) placeholder.hidden = false;
    if (preview) {
        preview.hidden = true;
        preview.removeAttribute('src');
        preview.src = '';
    }
    if (removeBtn) removeBtn.hidden = true;
    if (fileInput) fileInput.value = '';
    if (hiddenInput) {
        hiddenInput.value = '';
        hiddenInput._pendingFile = null;
    }
}

function setImagePreview(url) {
    const placeholder = document.getElementById('image-upload-placeholder');
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('image-remove-btn');
    if (!url) {
        resetImageUpload();
        return;
    }
    if (placeholder) placeholder.hidden = true;
    if (preview) {
        preview.src = url;
        preview.hidden = false;
    }
    if (removeBtn) removeBtn.hidden = false;
}

function setupImageUpload() {
    const area = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('p-imagen-file');
    const hiddenInput = document.getElementById('p-imagen');
    const removeBtn = document.getElementById('image-remove-btn');
    if (!area || !fileInput) return;

    area.addEventListener('click', (e) => {
        if (e.target.closest('#image-remove-btn')) return;
        fileInput.click();
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
        if (file) handleFileSelected(file, hiddenInput);
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) handleFileSelected(file, hiddenInput);
    });

    removeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetImageUpload();
    });
}

function handleFileSelected(file, hiddenInput) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
        toast('Solo se permiten imágenes JPG, PNG, WEBP o GIF', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        toast('La imagen no puede superar 5 MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    hiddenInput._pendingFile = file;
}

async function uploadPendingImage(token) {
    const hiddenInput = document.getElementById('p-imagen');
    if (!hiddenInput?._pendingFile) return { success: true, url: hiddenInput?.value || '' };

    const data = await uploadImage(hiddenInput._pendingFile, token);
    if (data.success && data.url) {
        hiddenInput.value = data.url;
        hiddenInput._pendingFile = null;
        return { success: true, url: data.url };
    }
    return { success: false, message: data.message || 'Error al subir la imagen' };
}

function updateDashboard(productos) {
    const total = productos.length;
    const stock = productos.reduce((acc, p) => acc + Number(p.stock || 0), 0);
    const activos = productos.filter((p) => p.activo).length;
    const line = document.getElementById('admin-inventory-line');
    if (line) {
        line.textContent = total
            ? `${total} en lista · ${activos} a la venta · ${stock} und. en nevera`
            : 'No llegó inventario. Revisa tu conexión y que tu usuario sea admin.';
    }
    const setStat = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val);
    };
    setStat('stat-total', total);
    setStat('stat-activos', activos);
    setStat('stat-stock', stock);
    setStat('stat-selected', selectedIds.size);
    renderRealAnalytics(productos);
}

/**
 * Renderiza métricas 100% reales de visitantes, clics por producto y pedidos WhatsApp.
 */
function renderRealAnalytics(productos) {
    if (!window.YogAnalytics) return;
    const metrics = window.YogAnalytics.getMetrics();
    const list = Array.isArray(productos) ? productos : (allAdminProducts || []);

    const totalVisits = Number(metrics.totalVisits) || 0;
    const totalOrders = Number(metrics.totalOrders) || 0;
    const productStats = metrics.productClicks || {};

    let totalClicks = 0;
    Object.values(productStats).forEach((p) => {
        totalClicks += (Number(p.clicks) || 0) + (Number(p.inspections) || 0) + (Number(p.cartAdds) || 0);
    });

    const conversion = totalVisits > 0 ? ((totalOrders / totalVisits) * 100).toFixed(1) : '0.0';

    const elVisitas = document.getElementById('analytics-visitas');
    if (elVisitas) elVisitas.textContent = totalVisits.toLocaleString('es-CO');

    const elClicks = document.getElementById('analytics-clicks');
    if (elClicks) elClicks.textContent = totalClicks.toLocaleString('es-CO');

    const elPedidos = document.getElementById('analytics-pedidos');
    if (elPedidos) elPedidos.textContent = totalOrders.toLocaleString('es-CO');

    const elConversion = document.getElementById('analytics-conversion');
    if (elConversion) elConversion.textContent = conversion + '%';

    renderFlavorAnalyticsBars(list, productStats, totalClicks);
}

function renderFlavorAnalyticsBars(productos, productStats, totalClicks) {
    const container = document.getElementById('admin-flavor-bars');
    const counterEl = document.getElementById('analytics-products-count');
    if (!container) return;

    const mergedMap = new Map();

    (productos || []).forEach((p) => {
        const id = String(p.id);
        const stats = productStats[id] || productStats[p.slug] || {};
        const clicks = (Number(stats.clicks) || 0) + (Number(stats.inspections) || 0) + (Number(stats.cartAdds) || 0);
        mergedMap.set(id, {
            id: id,
            nombre: p.nombre || ('Producto #' + id),
            clicks: clicks,
            color: p.color_acento || 'var(--rojo-marca, #C3343E)'
        });
    });

    Object.keys(productStats || {}).forEach((k) => {
        if (!mergedMap.has(k)) {
            const stats = productStats[k];
            const clicks = (Number(stats.clicks) || 0) + (Number(stats.inspections) || 0) + (Number(stats.cartAdds) || 0);
            mergedMap.set(k, {
                id: k,
                nombre: stats.nombre || ('Producto #' + k),
                clicks: clicks,
                color: 'var(--rojo-marca, #C3343E)'
            });
        }
    });

    const items = Array.from(mergedMap.values());
    items.sort((a, b) => b.clicks - a.clicks);

    if (counterEl) {
        counterEl.textContent = items.length + (items.length === 1 ? ' producto' : ' productos');
    }

    if (!items.length) {
        container.innerHTML = '<p class="admin-empty-state" style="padding: 16px; color: #888;">No hay productos en inventario.</p>';
        return;
    }

    const html = items.map((item) => {
        const pct = totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100) : 0;
        const widthStyle = 'width: ' + Math.max(pct, item.clicks > 0 ? 5 : 0) + '%; background: ' + item.color + ';';
        return '<div class="admin-bar-item">' +
            '<div class="admin-bar-label">' +
                '<span>' + escapeHtml(item.nombre) + '</span>' +
                '<strong>' + pct + '% (' + item.clicks + (item.clicks === 1 ? ' clic' : ' clics') + ')</strong>' +
            '</div>' +
            '<div class="admin-bar-track">' +
                '<div class="admin-bar-fill" style="' + widthStyle + '"></div>' +
            '</div>' +
        '</div>';
    }).join('');

    container.innerHTML = html;
}


function populateCategoryFilter(productos) {
    const select = document.getElementById('admin-filter-cat');
    if (!select) return;
    const current = select.value;
    const cats = [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todas las categorías</option>'
        + cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if (current && cats.includes(current)) select.value = current;
}

function compareProducts(a, b, key) {
    if (key === 'precio' || key === 'stock' || key === 'id') {
        const diff = Number(a[key] || 0) - Number(b[key] || 0);
        return sortDir === 'asc' ? diff : -diff;
    }
    if (key === 'activo') {
        const diff = Number(Boolean(a.activo)) - Number(Boolean(b.activo));
        return sortDir === 'asc' ? diff : -diff;
    }
    const va = String(a[key] || '').toLowerCase();
    const vb = String(b[key] || '').toLowerCase();
    const cmp = va.localeCompare(vb, 'es');
    return sortDir === 'asc' ? cmp : -cmp;
}

function getVisibleProducts() {
    const q = (document.getElementById('admin-search')?.value || '').trim().toLowerCase();
    const cat = document.getElementById('admin-filter-cat')?.value || '';
    const status = document.getElementById('admin-filter-status')?.value || '';

    let list = allAdminProducts.filter((p) => {
        const matchQ = !q
            || String(p.nombre || '').toLowerCase().includes(q)
            || String(p.categoria || '').toLowerCase().includes(q)
            || String(p.id).includes(q);
        const matchCat = !cat || p.categoria === cat;
        const matchStatus = !status
            || (status === 'active' && p.activo)
            || (status === 'inactive' && !p.activo);
        return matchQ && matchCat && matchStatus;
    });

    list = [...list].sort((a, b) => compareProducts(a, b, sortKey));
    return list;
}

function updateSortHeaders() {
    document.querySelectorAll('.admin-sheet th.sortable').forEach((th) => {
        const key = th.dataset.sort;
        const active = key === sortKey;
        th.classList.toggle('is-sorted', active);
        th.dataset.dir = active ? sortDir : '';
    });
}

function updateBulkButtons() {
    const has = selectedIds.size > 0;
    const btnOff = document.getElementById('btn-bulk-deactivate');
    const btnOn = document.getElementById('btn-bulk-activate');
    if (btnOff) btnOff.disabled = !has;
    if (btnOn) btnOn.disabled = !has;
    const stat = document.getElementById('stat-selected');
    if (stat) stat.textContent = String(selectedIds.size);
}

function syncSelectAllCheckbox(visible) {
    const allBox = document.getElementById('admin-select-all');
    if (!allBox) return;
    const ids = visible.map((p) => p.id);
    const selectedVisible = ids.filter((id) => selectedIds.has(id));
    allBox.checked = ids.length > 0 && selectedVisible.length === ids.length;
    allBox.indeterminate = selectedVisible.length > 0 && selectedVisible.length < ids.length;
}

function exportProductsCsv(productos) {
    const rows = productos.length ? productos : getVisibleProducts();
    const header = ['ID', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Estado', 'Letrero', 'Descuento'];
    const lines = rows.map((p) => [
        p.id,
        `"${String(p.nombre || '').replace(/"/g, '""')}"`,
        `"${String(p.categoria || '').replace(/"/g, '""')}"`,
        Number(p.precio || 0),
        Number(p.stock || 0),
        p.activo ? 'Activo' : 'Inactivo',
        `"${String(p.letrero || '').replace(/"/g, '""')}"`,
        Number(p.descuento || 0)
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yoguraso-inventario-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exportados ${rows.length} productos`, 'success');
}

async function setProductoActivo(producto, activo) {
    if (activo) return updateProduct(producto.id, { activo: true });
    return deleteProduct(producto.id);
}

function renderRows(productos) {
    const lista = document.getElementById('admin-productos-lista');
    if (!lista) return;

    updateSortHeaders();
    syncSelectAllCheckbox(productos);
    updateBulkButtons();

    if (!productos.length) {
        lista.innerHTML = '<tr><td colspan="9" class="admin-sheet-empty">No hay productos para mostrar con estos filtros.</td></tr>';
        return;
    }

    lista.innerHTML = productos.map((p) => `
        <tr class="${p.activo ? '' : 'is-row-inactive'}${selectedIds.has(p.id) ? ' is-row-selected' : ''}" data-id="${escapeHtml(p.id)}">
            <td class="col-check"><input type="checkbox" class="row-select" data-id="${escapeHtml(p.id)}" ${selectedIds.has(p.id) ? 'checked' : ''} aria-label="Seleccionar ${escapeHtml(p.nombre)}"></td>
            <td><span class="admin-id">#${escapeHtml(p.id)}</span></td>
            <td>
                <div class="admin-product-cell">
                    ${p.imagen_url
                        ? `<img src="${escapeHtml(imgSrc(p.imagen_url))}" alt="" class="admin-thumb" onerror="this.style.display='none'">`
                        : '<span class="admin-thumb placeholder" aria-hidden="true"><i class="fas fa-image"></i></span>'}
                    <strong>${escapeHtml(p.nombre)}</strong>
                </div>
            </td>
            <td><span class="admin-chip">${escapeHtml(p.categoria || 'Yogur')}</span></td>
            <td class="admin-price">$${Number(p.precio || 0).toLocaleString('es-CO')}</td>
            <td><span class="admin-stock">${escapeHtml(p.stock || 0)} <small>und</small></span></td>
            <td><span class="status-pill ${p.activo ? 'is-active' : 'is-inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>${p.letrero ? `<span class="admin-chip">${escapeHtml(p.letrero)}</span>` : '—'}</td>
            <td class="admin-actions">
                <button type="button" class="btn-edit" data-id="${escapeHtml(p.id)}">Editar</button>
                <button type="button" class="${p.activo ? 'btn-delete' : 'btn-activate'}" data-id="${escapeHtml(p.id)}" data-activo="${p.activo ? '1' : '0'}">
                    ${p.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button type="button" class="btn-delete-permanent" data-id="${escapeHtml(p.id)}" aria-label="Eliminar ${escapeHtml(p.nombre)} definitivamente" title="Eliminar definitivamente">Eliminar</button>
            </td>
        </tr>
    `).join('');

    lista.querySelectorAll('.row-select').forEach((box) => {
        box.addEventListener('change', () => {
            const id = Number(box.dataset.id);
            if (box.checked) selectedIds.add(id);
            else selectedIds.delete(id);
            box.closest('tr')?.classList.toggle('is-row-selected', box.checked);
            syncSelectAllCheckbox(productos);
            updateBulkButtons();
        });
    });

    lista.querySelectorAll('.btn-edit').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const rawId = btn.dataset.id;
            const producto = allAdminProducts.find((item) => String(item.id) === String(rawId));
            if (!producto) {
                console.warn('[admin] No se encontró el producto para ID:', rawId);
                toast('No se encontró el producto en el catálogo', 'error');
                return;
            }
            editandoId = producto.id;
            try {
                llenarFormulario(producto);
            } catch (err) {
                console.error('[admin] Error al llenar formulario:', err);
            }
            abrirModal('Editar producto', { isEdit: true });
        });
    });

    lista.querySelectorAll('.btn-delete, .btn-activate').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const producto = allAdminProducts.find((item) => String(item.id) === String(id));
            if (!producto) return;

            const activar = !producto.activo;
            const ok = confirmAction
                ? await confirmAction({
                    title: activar ? 'Activar producto' : 'Desactivar producto',
                    message: activar
                        ? `¿Activar "${producto.nombre}"? Volverá a verse en el catálogo.`
                        : `¿Desactivar "${producto.nombre}"? Quedará oculto del catálogo (puedes activarlo después).`,
                    confirmText: activar ? 'Sí, activar' : 'Sí, desactivar',
                    cancelText: 'Cancelar',
                    danger: !activar,
                    type: activar ? 'success' : 'warning'
                })
                : window.confirm(activar ? '¿Activar producto?' : '¿Desactivar producto?');

            if (!ok) return;

            btn.disabled = true;
            const res = await setProductoActivo(producto, activar);
            btn.disabled = false;

            if (!res.success) {
                toast(res.message || 'No se pudo actualizar', 'error');
                return;
            }
            toast(activar ? 'Producto activado' : 'Producto desactivado', 'success');
            await cargarTablaProductos();
        });
    });

    lista.querySelectorAll('.btn-delete-permanent').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const rawId = btn.dataset.id;
            const producto = allAdminProducts.find((item) => String(item.id) === String(rawId));
            if (!producto) return;

            const ok = confirmAction
                ? await confirmAction({
                    title: 'Eliminar producto definitivamente',
                    message: `¿Eliminar "${producto.nombre}" del catálogo? Esta acción no se puede deshacer. También quitará el producto de los carritos guardados; el historial de pedidos conservará su detalle.`,
                    confirmText: 'Eliminar definitivamente',
                    cancelText: 'Conservar producto',
                    danger: true,
                    type: 'danger'
                })
                : window.confirm(`¿Eliminar "${producto.nombre}" definitivamente? Esta acción no se puede deshacer.`);

            if (!ok) return;

            btn.disabled = true;
            const result = await permanentlyDeleteProduct(id, getToken());
            btn.disabled = false;

            if (!result.success) {
                toast(result.message || 'No se pudo eliminar el producto', 'error');
                return;
            }

            selectedIds.delete(id);
            toast('Producto eliminado definitivamente', 'success');
            await cargarTablaProductos();
        });
    });
}

let allAdminUsers = [];

function getVisibleUsers() {
    const q = (document.getElementById('admin-user-search')?.value || '').trim().toLowerCase();
    if (!q) return allAdminUsers;
    return allAdminUsers.filter((u) => {
        const name = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
        return name.includes(q) || String(u.email || '').toLowerCase().includes(q) || String(u.id).includes(q);
    });
}

function renderUserRows(users) {
    const lista = document.getElementById('admin-usuarios-lista');
    if (!lista) return;

    if (!users.length) {
        lista.innerHTML = '<tr><td colspan="6" class="admin-sheet-empty">No hay usuarios que coincidan con la búsqueda.</td></tr>';
        return;
    }

    const yo = getUsuario();
    lista.innerHTML = users.map((u) => `
        <tr class="${u.activo ? '' : 'is-row-inactive'}">
            <td><span class="admin-id">#${escapeHtml(u.id)}</span></td>
            <td><strong>${escapeHtml(`${u.nombre || ''} ${u.apellido || ''}`.trim())}</strong></td>
            <td class="admin-email">${escapeHtml(u.email || '')}</td>
            <td><span class="admin-chip admin-chip-role">${escapeHtml(u.rol || '')}</span></td>
            <td><span class="status-pill ${u.activo ? 'is-active' : 'is-inactive'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td class="admin-actions">
                <button type="button" class="${u.activo ? 'btn-delete' : 'btn-activate'} btn-toggle-user" data-id="${escapeHtml(u.id)}" ${yo?.id === u.id ? 'disabled' : ''}>
                    ${u.activo ? 'Desactivar' : 'Activar'}
                </button>
            </td>
        </tr>
    `).join('');

    lista.querySelectorAll('.btn-toggle-user').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const resToggle = await toggleUserActive(id, getToken());
            if (!resToggle.success) {
                toast(resToggle.message || 'No se pudo actualizar', 'error');
                return;
            }
            toast(resToggle.message || 'Usuario actualizado', 'success');
            await cargarTablaUsuarios();
    await cargarTablaPreguntas();
        });
    });
}

async function cargarTablaUsuarios() {
    const lista = document.getElementById('admin-usuarios-lista');
    if (!lista) return;

    const res = await fetchUsers(getToken());
    if (!res.success) {
        lista.innerHTML = `<tr><td colspan="6" class="admin-sheet-empty">${escapeHtml(res.message || 'No se pudieron cargar usuarios')}</td></tr>`;
        return;
    }

    allAdminUsers = res.users || [];
    renderUserRows(getVisibleUsers());
}

function payloadDesdeFormulario() {
    const categoriaKey = document.getElementById('p-categoria')?.value || 'natural';
    const letrero = document.getElementById('p-letrero')?.value.trim() || '';
    const tipoLetrero = document.getElementById('p-letrero-tipo')?.value || '';
    return {
        nombre: document.getElementById('p-nombre')?.value.trim(),
        precio: Number(document.getElementById('p-precio')?.value || 0),
        stock: Number(document.getElementById('p-stock')?.value || 0),
        descripcion: document.getElementById('p-descripcion')?.value.trim() || '',
        imagen_url: document.getElementById('p-imagen')?.value.trim() || '',
        categoria: categoriaMap[categoriaKey] || 'Natural',
        color_fondo: document.getElementById('p-color-fondo')?.value || '#FFF8F4',
        color_acento: document.getElementById('p-color-acento')?.value || '#D62300',
        activo: document.getElementById('p-activo')?.type === 'checkbox' ? Boolean(document.getElementById('p-activo')?.checked) : (document.getElementById('p-activo')?.value !== 'false'),
        letrero,
        letrero_tipo: letrero ? tipoLetrero : '',
        descuento: Number(document.getElementById('p-descuento')?.value || 0),
        precio_1l: Number(document.getElementById('p-precio-1l')?.value || 0)
    };
}

function llenarFormulario(producto) {
    if (!producto) return;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    };

    setVal('p-id', producto.id);
    setVal('p-nombre', producto.nombre || '');
    setVal('p-precio', producto.precio || 0);
    setVal('p-precio-1l', producto.precio_1l || '');
    setVal('p-stock', producto.stock || 0);
    setVal('p-descripcion', producto.descripcion || '');
    setVal('p-imagen', producto.imagen_url || '');
    if (producto.imagen_url) setImagePreview(imgSrc(producto.imagen_url));
    else resetImageUpload();

    let categoriaKey = Object.keys(categoriaMap).find((key) => categoriaMap[key] === producto.categoria);
    const catSelect = document.getElementById('p-categoria');
    if (!categoriaKey && producto.categoria && catSelect) {
        categoriaKey = 'db_' + String(producto.categoria).toLowerCase().replace(/[^a-z0-9]+/g, '_');
        categoriaMap[categoriaKey] = producto.categoria;
        if (!catSelect.querySelector('option[value="' + categoriaKey + '"]')) {
            const opt = document.createElement('option');
            opt.value = categoriaKey;
            opt.textContent = producto.categoria;
            catSelect.appendChild(opt);
        }
    }
    if (catSelect) catSelect.value = categoriaKey || 'natural';

    const colorFondo = document.getElementById('p-color-fondo');
    if (colorFondo) colorFondo.value = /^#[0-9A-Fa-f]{6}$/.test(producto.color_fondo || '') ? producto.color_fondo : '#FFF8F4';
    
    const activoEl = document.getElementById('p-activo');
    if (activoEl) { if (activoEl.type === 'checkbox') activoEl.checked = Boolean(producto.activo); else activoEl.value = producto.activo ? 'true' : 'false'; }

    const tipo = producto.letrero_tipo || '';
    const texto = producto.letrero || '';
    const desc = Number(producto.descuento || 0);
    const colorAcento = producto.color_acento || '#D62300';
    const forma = producto.letrero_forma || 'pill';

    setVal('p-letrero', texto);
    setVal('p-descuento', desc);

    const hexText = document.getElementById('p-color-fondo-text');
    if (hexText && producto.color_fondo) hexText.value = producto.color_fondo.toUpperCase();

    setLetreroType(tipo || (desc > 0 ? 'descuento' : (texto ? 'personalizado' : '')));
    setBadgeColorActive(colorAcento);

    const shapeInput = document.getElementById('p-letrero-forma');
    if (shapeInput) shapeInput.value = forma;
    document.querySelectorAll('#adminShapePills .shape-pill').forEach((btn) => {
        btn.classList.toggle('is-active', (btn.dataset.shape || 'pill') === forma);
    });

    updateDiscountCalculator('percent');
    syncLiveCardPreview();
}

async function bulkSetActive(activo) {
    const ids = [...selectedIds];
    if (!ids.length) return;

    const label = activo ? 'activar' : 'desactivar';
    const ok = confirmAction
        ? await confirmAction({
            title: activo ? 'Activar selección' : 'Desactivar selección',
            message: `¿${activo ? 'Activar' : 'Desactivar'} ${ids.length} producto(s)?`,
            confirmText: `Sí, ${label}`,
            cancelText: 'Cancelar',
            danger: !activo,
            type: activo ? 'success' : 'warning'
        })
        : window.confirm(`¿${activo ? 'Activar' : 'Desactivar'} ${ids.length} producto(s)?`);

    if (!ok) return;

    let done = 0;
    for (const id of ids) {
        const producto = allAdminProducts.find((p) => p.id === id);
        if (!producto) continue;
        const res = await setProductoActivo(producto, activo);
        if (res.success) done += 1;
    }

    selectedIds.clear();
    toast(`${done} producto(s) ${activo ? 'activados' : 'desactivados'}`, 'success');
    await cargarTablaProductos();
}

async function cargarTablaProductos() {
    const lista = document.getElementById('admin-productos-lista');
    allAdminProducts = await fetchProducts(true, getToken());
    if (allAdminProducts._error) {
        updateDashboard([]);
        if (lista) {
            lista.innerHTML = `<tr><td colspan="9" class="admin-sheet-empty">${escapeHtml(allAdminProducts._error)}. Revisa tu conexión y recarga.</td></tr>`;
        }
        return;
    }
    populateCategoryFilter(allAdminProducts);
    updateDashboard(allAdminProducts);
    renderRows(getVisibleProducts());
}


/* ==========================================================================
   MÓDULO 4: GESTIÓN DE PREGUNTAS DE CLIENTES (FAQ EN VIVO)
   ==========================================================================
   Permite al administrador ver todas las dudas enviadas por visitantes
   desde la tienda (formulario de preguntas o botón de Instagram), responderlas
   oficialmente y publicarlas en tiempo real para todos los clientes.
   Sincroniza con Supabase ('faq_questions') y con el almacenamiento canónico
   local ('yog_ix_v1') para garantizar disponibilidad 100% resiliente.
   ========================================================================== */

const STORAGE_IX_KEY = 'yog_ix_v1';
const LEGACY_IX_KEY = 'yog_local_interactions_v1';

async function cargarTablaPreguntas() {
    const listEl = document.getElementById('admin-questions-list');
    if (!listEl) return;

    let sbQuestions = [];
    // 1. Intentar consultar preguntas desde la base de datos Supabase
    try {
        const sb = await import('./supabase-client.js').then((m) => m.obtenerSupabase()).catch(() => null);
        if (sb) {
            const { data, error } = await sb.from('faq_questions').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) {
                sbQuestions = data;
            }
        }
    } catch (_) {}

    // 2. Leer preguntas del almacenamiento local canónico de la tienda ('yog_ix_v1')
    let localQuestions = [];
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_IX_KEY) || '{}');
        if (Array.isArray(raw.questions)) localQuestions = raw.questions;
    } catch (_) {}

    // 3. Leer también del almacén legacy si existiera para no perder historial previo
    try {
        const rawLegacy = JSON.parse(localStorage.getItem(LEGACY_IX_KEY) || '{}');
        if (Array.isArray(rawLegacy.questions)) {
            localQuestions = [...localQuestions, ...rawLegacy.questions];
        }
    } catch (_) {}

    // 4. Unir y deduplicar por ID (dando prioridad a la información más completa)
    const map = new Map();
    sbQuestions.forEach((q) => map.set(String(q.id), { ...q }));
    localQuestions.forEach((q) => {
        const key = String(q.id);
        if (!map.has(key)) {
            map.set(key, { ...q });
        } else {
            const cur = map.get(key);
            if (q.answer && !cur.answer) {
                cur.answer = q.answer;
                cur.status = q.status || 'approved';
            }
        }
    });

    let questions = Array.from(map.values());

    // 5. Semillas demostrativas si no hay preguntas aún (para pruebas iniciales)
    if (!questions.length) {
        questions = [
            {
                id: 'q-demo-1',
                author_name: 'María Alejandra',
                body: '¿Hacen envíos a domicilio en Neiva los fines de semana y qué costo tiene?',
                answer: '¡Hola María! Sí, realizamos entregas en Neiva los sábados y domingos en la mañana sin costo adicional por pedidos desde 3 botellas.',
                status: 'approved',
                created_at: new Date(Date.now() - 3600000 * 4).toISOString()
            },
            {
                id: 'q-demo-2',
                author_name: 'Carlos Gómez',
                body: '¿Cuál es la presentación más recomendada para familias o negocios de desayunos?',
                answer: '',
                status: 'pending',
                created_at: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
                id: 'q-demo-3',
                author_name: 'Valentina R.',
                body: '¿El yogurt artesanal tiene conservantes artificiales o es 100% natural?',
                answer: '',
                status: 'pending',
                created_at: new Date(Date.now() - 3600000 * 1).toISOString()
            }
        ];
    }

    questions.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    allAdminQuestions = questions;

    updateQuestionStats();
    renderAdminQuestions(getVisibleQuestions());
}

function updateQuestionStats() {
    const total = allAdminQuestions.length;
    const pending = allAdminQuestions.filter((q) => !q.answer || q.status === 'pending').length;
    const answered = total - pending;

    const tEl = document.getElementById('stat-q-total');
    const pEl = document.getElementById('stat-q-pending');
    const aEl = document.getElementById('stat-q-answered');
    const chip = document.getElementById('admin-pending-q-chip');

    if (tEl) tEl.textContent = String(total);
    if (pEl) pEl.textContent = String(pending);
    if (aEl) aEl.textContent = String(answered);

    if (chip) {
        chip.textContent = String(pending);
        chip.style.display = pending > 0 ? 'inline-block' : 'none';
    }
}

function getVisibleQuestions() {
    const q = (document.getElementById('admin-q-search')?.value || '').trim().toLowerCase();
    const filter = document.getElementById('admin-q-filter')?.value || '';

    return allAdminQuestions.filter((item) => {
        const matchQ = !q
            || String(item.body || '').toLowerCase().includes(q)
            || String(item.author_name || '').toLowerCase().includes(q)
            || String(item.answer || '').toLowerCase().includes(q);

        const isAnswered = Boolean(item.answer && item.status === 'approved');
        const matchFilter = !filter
            || (filter === 'pending' && !isAnswered)
            || (filter === 'approved' && isAnswered);

        return matchQ && matchFilter;
    });
}

function renderAdminQuestions(questions) {
    const host = document.getElementById('admin-questions-list');
    if (!host) return;

    if (!questions.length) {
        host.innerHTML = '<div class="admin-sheet-empty" style="background:#fff; border-radius:16px; padding:32px; text-align:center;">No hay preguntas para mostrar con este filtro.</div>';
        return;
    }

    host.innerHTML = questions.map((item) => {
        const who = escapeHtml(item.author_name || 'Cliente anónimo');
        const body = escapeHtml(item.body || '');
        const hasAnswer = Boolean(item.answer && item.status === 'approved');
        const answer = escapeHtml(item.answer || '');
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Reciente';

        return `
            <article class="admin-q-card ${hasAnswer ? 'is-answered' : 'is-pending'}" data-id="${item.id}">
                <div class="admin-q-head">
                    <span class="admin-q-author"><i class="fas fa-user-circle"></i> ${who}</span>
                    <div class="admin-q-meta">
                        <span class="admin-q-date"><i class="far fa-clock"></i> ${dateStr}</span>
                        <span class="status-pill ${hasAnswer ? 'is-active' : ''}" style="${hasAnswer ? '' : 'background:#FEECE0; color:#D35400;'}">
                            ${hasAnswer ? '<i class="fas fa-check-circle"></i> Respondida' : '<i class="fas fa-hourglass-half"></i> Pendiente'}
                        </span>
                    </div>
                </div>

                <div class="admin-q-body">
                    <strong>Pregunta del cliente:</strong> "${body}"
                </div>

                ${hasAnswer ? `
                    <div class="admin-q-answer-published" id="q-answer-box-${item.id}">
                        <strong><i class="fas fa-comment-dots"></i> Respuesta oficial publicada en la tienda:</strong>
                        <p>${answer}</p>
                    </div>
                ` : ''}

                <div class="admin-q-reply-box">
                    <label for="q-reply-${item.id}"><i class="fas fa-reply"></i> ${hasAnswer ? 'Editar respuesta oficial:' : 'Escribir respuesta oficial de YogurASO:'}</label>
                    <textarea class="admin-q-textarea" id="q-reply-${item.id}" rows="2" placeholder="Escribe aquí la respuesta para el cliente...">${hasAnswer ? item.answer : ''}</textarea>
                    
                    <div class="admin-q-actions">
                        <button type="button" class="btn btn-secondary btn-del-q" data-id="${item.id}" title="Eliminar pregunta" style="color: #C3343E;">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                        <button type="button" class="btn btn-primary btn-save-q-reply" data-id="${item.id}">
                            <i class="fas fa-paper-plane"></i> ${hasAnswer ? 'Actualizar respuesta' : 'Responder y publicar'}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Eventos para guardar respuesta
    host.querySelectorAll('.btn-save-q-reply').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const textarea = document.getElementById(`q-reply-${id}`);
            const replyText = textarea?.value.trim();
            if (!replyText) {
                toast('Escribe una respuesta antes de guardar', 'warning');
                textarea?.focus();
                return;
            }

            btn.disabled = true;
            await guardarRespuestaPregunta(id, replyText);
            btn.disabled = false;
        });
    });

    // Eventos para eliminar pregunta
    host.querySelectorAll('.btn-del-q').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const ok = confirmAction
                ? await confirmAction({
                    title: 'Eliminar pregunta',
                    message: '¿Estás seguro de eliminar esta pregunta?',
                    confirmText: 'Sí, eliminar',
                    cancelText: 'Cancelar',
                    danger: true
                })
                : window.confirm('¿Eliminar esta pregunta?');

            if (!ok) return;
            btn.disabled = true;
            await eliminarPregunta(id);
        });
    });
}

async function guardarRespuestaPregunta(id, answer) {
    // 1. Actualizar estado en memoria
    const qIdx = allAdminQuestions.findIndex((q) => String(q.id) === String(id));
    if (qIdx !== -1) {
        allAdminQuestions[qIdx].answer = answer;
        allAdminQuestions[qIdx].status = 'approved';
        allAdminQuestions[qIdx].updated_at = new Date().toISOString();
    }

    // 2. Actualizar en Supabase si está disponible
    try {
        const sb = await import('./supabase-client.js').then((m) => m.obtenerSupabase()).catch(() => null);
        if (sb) {
            await sb.from('faq_questions').update({
                answer,
                status: 'approved'
            }).eq('id', id);
        }
    } catch (_) {}

    // 3. Actualizar en almacenamiento local canónico 'yog_ix_v1'
    try {
        const local = JSON.parse(localStorage.getItem(STORAGE_IX_KEY) || '{}');
        local.questions = Array.isArray(local.questions) ? local.questions : [];
        const locIdx = local.questions.findIndex((q) => String(q.id) === String(id));
        if (locIdx !== -1) {
            local.questions[locIdx].answer = answer;
            local.questions[locIdx].status = 'approved';
        } else if (qIdx !== -1) {
            local.questions.unshift(allAdminQuestions[qIdx]);
        }
        localStorage.setItem(STORAGE_IX_KEY, JSON.stringify(local));
    } catch (_) {}

    toast('Respuesta publicada con éxito', 'success');
    updateQuestionStats();
    renderAdminQuestions(getVisibleQuestions());
}

async function eliminarPregunta(id) {
    allAdminQuestions = allAdminQuestions.filter((q) => String(q.id) !== String(id));

    // Eliminar en Supabase
    try {
        const sb = await import('./supabase-client.js').then((m) => m.obtenerSupabase()).catch(() => null);
        if (sb) await sb.from('faq_questions').delete().eq('id', id);
    } catch (_) {}

    // Eliminar en almacenamiento local canónico
    try {
        const local = JSON.parse(localStorage.getItem(STORAGE_IX_KEY) || '{}');
        if (Array.isArray(local.questions)) {
            local.questions = local.questions.filter((q) => String(q.id) !== String(id));
            localStorage.setItem(STORAGE_IX_KEY, JSON.stringify(local));
        }
    } catch (_) {}

    toast('Pregunta eliminada', 'success');
    updateQuestionStats();
    renderAdminQuestions(getVisibleQuestions());
}


/* ==========================================================================
   MÓDULO 5: GESTIÓN DE ANUNCIOS Y MULTIMEDIA (BANNER / VIDEO CON AUDIO / MODAL)
   ==========================================================================
   Permite al administrador crear, editar, pausar y eliminar anuncios
   promocionales visibles para los clientes.
   Soporta:
   1) Videos con controles nativos de reproducción y audio regulable.
   2) Imágenes publicitarias de alta resolución.
   3) Anuncios de solo texto y promociones especiales.
   4) Ubicación en Barra Superior Fija (Top Banner) o Ventana Modal Emergente.
   ========================================================================== */

const STORAGE_ANUNCIOS_KEY = 'yog_anuncios_v1';
let allAdminAnuncios = [];
let editandoAnuncioId = null;

async function cargarTablaAnuncios() {
    const grid = document.getElementById('admin-anuncios-grid');
    if (!grid) return;

    // Cargar anuncios de localStorage
    let ancs = [];
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_ANUNCIOS_KEY) || 'null');
        if (Array.isArray(raw) && raw.length) ancs = raw;
    } catch (_) {}

    // Semillas demostrativas completas si está vacío
    if (!ancs.length) {
        ancs = [
            {
                id: 'anc-video-huila',
                title: 'Nuestra Cosecha & Pasión Artesanal',
                message: 'Conoce en este video cómo transformamos leche fresca de las granjas del Huila en un yogurt artesanal ultra cremoso.',
                placement: 'modal',
                media_type: 'video',
                media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                has_audio: true,
                video_muted: false,
                action_label: 'Probar Sabores Artesanales',
                action_url: '#productos',
                badge_text: 'VIDEO DESTACADO',
                active: true,
                created_at: new Date(Date.now() - 3600000 * 5).toISOString()
            },
            {
                id: 'anc-banner-domicilio',
                title: '¡Lanzamiento Especial!',
                message: 'Pide 3 botellas o más y disfruta de domicilio sin costo adicional en Neiva.',
                placement: 'banner',
                media_type: 'none',
                media_url: '',
                has_audio: false,
                video_muted: true,
                action_label: 'Pedir por WhatsApp',
                action_url: 'https://wa.me/573144882046?text=Hola%20YogurASO,%20quiero%20aprovechar%20el%20domicilio%20gratis',
                badge_text: 'PROMO HOY',
                active: true,
                created_at: new Date(Date.now() - 3600000 * 24).toISOString()
            }
        ];
        try { localStorage.setItem(STORAGE_ANUNCIOS_KEY, JSON.stringify(ancs)); } catch (_) {}
    }

    allAdminAnuncios = ancs;
    updateAnunciosStats();
    renderAdminAnuncios(getVisibleAnuncios());
}

function updateAnunciosStats() {
    const total = allAdminAnuncios.length;
    const activos = allAdminAnuncios.filter((a) => a.active !== false).length;
    const conMedia = allAdminAnuncios.filter((a) => a.media_type === 'video' || a.media_type === 'image').length;

    const tEl = document.getElementById('stat-anc-total');
    const aEl = document.getElementById('stat-anc-active');
    const mEl = document.getElementById('stat-anc-media');
    const chip = document.getElementById('admin-active-announcements-chip');

    if (tEl) tEl.textContent = String(total);
    if (aEl) aEl.textContent = String(activos);
    if (mEl) mEl.textContent = String(conMedia);

    if (chip) {
        chip.textContent = String(activos);
        chip.style.display = activos > 0 ? 'inline-block' : 'none';
    }
}

function getVisibleAnuncios() {
    const q = (document.getElementById('admin-anc-search')?.value || '').trim().toLowerCase();
    const placement = document.getElementById('admin-anc-filter-placement')?.value || '';
    const type = document.getElementById('admin-anc-filter-type')?.value || '';
    const status = document.getElementById('admin-anc-filter-status')?.value || '';

    return allAdminAnuncios.filter((item) => {
        const matchQ = !q
            || String(item.title || '').toLowerCase().includes(q)
            || String(item.message || '').toLowerCase().includes(q)
            || String(item.badge_text || '').toLowerCase().includes(q);

        const matchPlacement = !placement || item.placement === placement;
        const matchType = !type || item.media_type === type;
        const isActive = item.active !== false;
        const matchStatus = !status
            || (status === 'active' && isActive)
            || (status === 'inactive' && !isActive);

        return matchQ && matchPlacement && matchType && matchStatus;
    });
}

function renderAdminAnuncios(anuncios) {
    const grid = document.getElementById('admin-anuncios-grid');
    if (!grid) return;

    if (!anuncios.length) {
        grid.innerHTML = '<div class="admin-sheet-empty" style="grid-column: 1 / -1; background:#fff; border-radius:18px; padding:40px; text-align:center;">No hay anuncios registrados con estos filtros. Haz clic en "Nuevo anuncio" para publicar uno.</div>';
        return;
    }

    grid.innerHTML = anuncios.map((anc) => {
        const title = escapeHtml(anc.title || 'Sin título');
        const message = escapeHtml(anc.message || '');
        const badge = escapeHtml(anc.badge_text || '');
        const isActive = anc.active !== false;
        const isVideo = anc.media_type === 'video';
        const isImage = anc.media_type === 'image';
        const placementLabel = anc.placement === 'banner' ? 'Barra Superior' : 'Modal Emergente';
        const placementClass = anc.placement === 'banner' ? 'anc-tag-placement' : 'anc-tag-placement';

        let mediaTypeLabel = 'Solo texto';
        let mediaTagClass = 'anc-tag-media-text';
        if (isVideo) {
            mediaTypeLabel = 'Video';
            mediaTagClass = 'anc-tag-media-video';
        } else if (isImage) {
            mediaTypeLabel = 'Imagen';
            mediaTagClass = 'anc-tag-media-image';
        }

        // Renderizado del medio para preview
        let mediaPreviewHtml = '';
        if (isVideo && anc.media_url) {
            mediaPreviewHtml = `
                <div class="admin-anc-media-preview">
                    <video src="${escapeHtml(imgSrc(anc.media_url))}" controls preload="metadata" ${anc.video_muted ? 'muted' : ''}></video>
                </div>
            `;
        } else if (isImage && anc.media_url) {
            mediaPreviewHtml = `
                <div class="admin-anc-media-preview">
                    <img src="${escapeHtml(imgSrc(anc.media_url))}" alt="${title}" loading="lazy">
                </div>
            `;
        } else {
            mediaPreviewHtml = `
                <div class="admin-anc-media-preview">
                    <div class="anc-text-only-banner">
                        <i class="fas fa-bullhorn" style="font-size:24px; margin-bottom:6px; display:block; opacity:0.6;"></i>
                        Anuncio en formato texto sin multimedia
                    </div>
                </div>
            `;
        }

        const dateStr = anc.created_at ? new Date(anc.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Reciente';

        return `
            <article class="admin-anc-card ${isActive ? 'is-active' : 'is-inactive'}" data-id="${anc.id}">
                <div class="admin-anc-card-header">
                    <div class="admin-anc-tags">
                        <span class="anc-tag-badge ${placementClass}">${placementLabel}</span>
                        <span class="anc-tag-badge ${mediaTagClass}">${mediaTypeLabel}</span>
                        ${isVideo && anc.has_audio ? '<span class="anc-audio-badge"><i class="fas fa-volume-up"></i> Con audio</span>' : ''}
                    </div>

                    <label class="anc-toggle-switch" title="${isActive ? 'Pausar anuncio' : 'Activar anuncio'}">
                        <input type="checkbox" class="anc-toggle-input" data-id="${anc.id}" ${isActive ? 'checked' : ''}>
                        <span>${isActive ? 'Activo' : 'Pausa'}</span>
                    </label>
                </div>

                ${mediaPreviewHtml}

                <div class="admin-anc-card-body">
                    ${badge ? `<span class="admin-anc-promo-badge">${badge}</span>` : ''}
                    <h3 class="admin-anc-title">${title}</h3>
                    <p class="admin-anc-desc">${message}</p>

                    ${anc.action_label ? `
                        <div class="admin-anc-action-preview">
                            <span>Botón de acción:</span>
                            <span class="admin-anc-action-pill"><i class="fas fa-link"></i> ${escapeHtml(anc.action_label)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="admin-anc-card-footer">
                    <span class="admin-anc-date"><i class="far fa-calendar-alt"></i> ${dateStr}</span>
                    <div class="admin-anc-buttons">
                        <button type="button" class="btn btn-secondary btn-sm btn-edit-anc" data-id="${anc.id}" title="Editar anuncio">
                            <i class="fas fa-pencil-alt"></i> Editar
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm btn-del-anc" data-id="${anc.id}" title="Eliminar anuncio" style="color: #C3343E;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Toggle de activación directa
    grid.querySelectorAll('.anc-toggle-input').forEach((input) => {
        input.addEventListener('change', () => {
            const id = input.dataset.id;
            toggleAnuncioActivo(id, input.checked);
        });
    });

    // Editar anuncio
    grid.querySelectorAll('.btn-edit-anc').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const anc = allAdminAnuncios.find((a) => String(a.id) === String(id));
            if (!anc) return;
            abrirModalAnuncio(true, anc);
        });
    });

    // Eliminar anuncio
    grid.querySelectorAll('.btn-del-anc').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const ok = confirmAction
                ? await confirmAction({
                    title: 'Eliminar anuncio',
                    message: '¿Estás seguro de eliminar este anuncio de la tienda?',
                    confirmText: 'Sí, eliminar',
                    cancelText: 'Cancelar',
                    danger: true
                })
                : window.confirm('¿Eliminar este anuncio?');

            if (!ok) return;
            eliminarAnuncio(id);
        });
    });
}

function abrirModalAnuncio(isEdit = false, anc = null) {
    const modal = document.getElementById('modal-anuncio');
    const titleEl = document.getElementById('modal-anc-title');
    const hintEl = document.getElementById('modal-anc-hint');
    const eyebrowEl = document.getElementById('modal-anc-eyebrow');
    if (!modal) return;

    editandoAnuncioId = isEdit && anc ? anc.id : null;

    if (titleEl) titleEl.textContent = isEdit ? 'Editar Anuncio' : 'Crear Nuevo Anuncio';
    if (eyebrowEl) eyebrowEl.textContent = isEdit ? 'Edición de Promoción' : 'Alta de Promoción';
    if (hintEl) {
        hintEl.textContent = isEdit
            ? 'Modifica los textos, el video con audio o imagen del anuncio seleccionado.'
            : 'Configura un anuncio atractivo para captar clientes en la barra superior o en ventana emergente.';
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    };

    if (isEdit && anc) {
        setVal('anc-id', anc.id);
        setVal('anc-titulo', anc.title || '');
        setVal('anc-mensaje', anc.message || '');
        setVal('anc-placement', anc.placement || 'modal');
        setVal('anc-badge', anc.badge_text || '');
        setVal('anc-media-type', anc.media_type || 'video');
        setVal('anc-active', anc.active !== false ? 'true' : 'false');
        setVal('anc-media-url', anc.media_url || '');
        setVal('anc-action-label', anc.action_label || '');
        setVal('anc-action-url', anc.action_url || '');

        const chkAudio = document.getElementById('anc-has-audio');
        if (chkAudio) chkAudio.checked = anc.has_audio !== false;

        const chkMuted = document.getElementById('anc-video-muted');
        if (chkMuted) chkMuted.checked = Boolean(anc.video_muted);
    } else {
        setVal('anc-id', '');
        setVal('anc-titulo', '');
        setVal('anc-mensaje', '');
        setVal('anc-placement', 'modal');
        setVal('anc-badge', 'NOVEDAD');
        setVal('anc-media-type', 'video');
        setVal('anc-active', 'true');
        setVal('anc-media-url', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
        setVal('anc-action-label', 'Conocer Sabores');
        setVal('anc-action-url', '#productos');

        const chkAudio = document.getElementById('anc-has-audio');
        if (chkAudio) chkAudio.checked = true;

        const chkMuted = document.getElementById('anc-video-muted');
        if (chkMuted) chkMuted.checked = false;
    }

    syncAnuncioLivePreview();
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => { document.getElementById('anc-titulo')?.focus(); }, 40);
}

function cerrarModalAnuncio() {
    const modal = document.getElementById('modal-anuncio');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
    editandoAnuncioId = null;

    // Pausar video de preview si estuviera sonando
    const vid = document.getElementById('ancLiveMediaContainer')?.querySelector('video');
    if (vid) { try { vid.pause(); } catch (_) {} }
}

function syncAnuncioLivePreview() {
    const title = document.getElementById('anc-titulo')?.value.trim() || 'Título del anuncio';
    const message = document.getElementById('anc-mensaje')?.value.trim() || 'Mensaje o descripción del anuncio promocional...';
    const badge = document.getElementById('anc-badge')?.value.trim();
    const mediaType = document.getElementById('anc-media-type')?.value || 'video';
    const mediaUrl = document.getElementById('anc-media-url')?.value.trim();
    const hasAudio = document.getElementById('anc-has-audio')?.checked;
    const isMuted = document.getElementById('anc-video-muted')?.checked;
    const actionLabel = document.getElementById('anc-action-label')?.value.trim() || 'Ver promoción';

    const tEl = document.getElementById('ancLiveTitle');
    const mEl = document.getElementById('ancLiveMessage');
    const bEl = document.getElementById('ancLiveBadge');
    const aEl = document.getElementById('ancLiveActionBtn');
    const mediaBox = document.getElementById('ancLiveMediaContainer');
    const videoOptions = document.getElementById('ancVideoOptionsBox');
    const audioTip = document.getElementById('ancAudioTip');

    if (tEl) tEl.textContent = title;
    if (mEl) mEl.textContent = message;
    if (bEl) {
        bEl.textContent = badge || 'OFERTA';
        bEl.style.display = badge ? 'inline-block' : 'none';
    }
    if (aEl) aEl.textContent = actionLabel;

    // Mostrar/ocultar opciones de video con audio
    if (videoOptions) videoOptions.style.display = mediaType === 'video' ? 'flex' : 'none';
    if (audioTip) audioTip.style.display = mediaType === 'video' ? 'flex' : 'none';

    // Actualizar contenedor multimedia interactivo
    if (mediaBox) {
        if (mediaType === 'video' && mediaUrl) {
            mediaBox.innerHTML = `
                <video src="${imgSrc(mediaUrl)}" controls playsinline ${isMuted ? 'muted' : ''} style="width:100%; max-height:160px; background:#000; display:block;"></video>
            `;
            const vid = mediaBox.querySelector('video');
            if (vid && hasAudio && !isMuted) vid.volume = 0.9;
        } else if (mediaType === 'image' && mediaUrl) {
            mediaBox.innerHTML = `<img src="${imgSrc(mediaUrl)}" alt="Vista previa" style="width:100%; height:160px; object-fit:cover; display:block;">`;
        } else {
            mediaBox.innerHTML = `
                <div style="padding:28px 16px; text-align:center; color:#888; font-size:12.5px;">
                    <i class="fas fa-align-left" style="font-size:20px; display:block; margin-bottom:4px; opacity:0.6;"></i>
                    Solo texto (sin multimedia)
                </div>
            `;
        }
    }
}

function guardarAnuncio(payload) {
    if (editandoAnuncioId) {
        const idx = allAdminAnuncios.findIndex((a) => String(a.id) === String(editandoAnuncioId));
        if (idx !== -1) {
            allAdminAnuncios[idx] = { ...allAdminAnuncios[idx], ...payload, updated_at: new Date().toISOString() };
        }
    } else {
        const nuevo = {
            id: 'anc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            ...payload,
            created_at: new Date().toISOString()
        };
        allAdminAnuncios.unshift(nuevo);
    }

    try {
        localStorage.setItem(STORAGE_ANUNCIOS_KEY, JSON.stringify(allAdminAnuncios));
    } catch (_) {}

    toast(editandoAnuncioId ? 'Anuncio actualizado con éxito' : 'Anuncio publicado con éxito', 'success');
    cerrarModalAnuncio();
    updateAnunciosStats();
    renderAdminAnuncios(getVisibleAnuncios());
}

function toggleAnuncioActivo(id, activo) {
    const idx = allAdminAnuncios.findIndex((a) => String(a.id) === String(id));
    if (idx !== -1) {
        allAdminAnuncios[idx].active = Boolean(activo);
        try {
            localStorage.setItem(STORAGE_ANUNCIOS_KEY, JSON.stringify(allAdminAnuncios));
        } catch (_) {}
        toast(activo ? 'Anuncio activado en la tienda' : 'Anuncio pausado', 'success');
        updateAnunciosStats();
        renderAdminAnuncios(getVisibleAnuncios());
    }
}

function eliminarAnuncio(id) {
    allAdminAnuncios = allAdminAnuncios.filter((a) => String(a.id) !== String(id));
    try {
        localStorage.setItem(STORAGE_ANUNCIOS_KEY, JSON.stringify(allAdminAnuncios));
    } catch (_) {}
    toast('Anuncio eliminado', 'success');
    updateAnunciosStats();
    renderAdminAnuncios(getVisibleAnuncios());
}

function setupAdminEvents() {
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    const modal = document.getElementById('modal-producto');
    const form = document.getElementById('form-producto');
    const search = document.getElementById('admin-search');
    const tableList = document.getElementById('admin-productos-lista');
    tableList?.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-edit');
        if (!btn) return;
        const rawId = btn.dataset.id;
        const producto = allAdminProducts.find((item) => String(item.id) === String(rawId));
        if (!producto) return;
        if (editandoId === producto.id && document.getElementById('modal-producto')?.style.display === 'flex') return;
        editandoId = producto.id;
        try {
            llenarFormulario(producto);
        } catch (err) {
            console.error('[admin] Error al llenar formulario:', err);
        }
        abrirModal('Editar producto', { isEdit: true });
    });

    document.getElementById('btn-reload-users')?.addEventListener('click', () => cargarTablaUsuarios());
    document.getElementById('admin-user-search')?.addEventListener('input', () => renderUserRows(getVisibleUsers()));
        // ----------------------------------------------------
    // Conexión del Módulo de Preguntas y Anuncios
    // ----------------------------------------------------
    document.getElementById('btn-reload-questions')?.addEventListener('click', () => cargarTablaPreguntas());
    document.getElementById('admin-q-search')?.addEventListener('input', () => renderAdminQuestions(getVisibleQuestions()));
    document.getElementById('admin-q-filter')?.addEventListener('change', () => renderAdminQuestions(getVisibleQuestions()));

    // Escuchar preguntas enviadas por clientes desde otras pestañas o ventanas
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_IX_KEY || e.key === LEGACY_IX_KEY) {
            cargarTablaPreguntas();
        }
        if (e.key === STORAGE_ANUNCIOS_KEY) {
            cargarTablaAnuncios();
        }
    });

    // Módulo de Anuncios: Toolbar y Modales
    document.getElementById('btn-nuevo-anuncio')?.addEventListener('click', () => {
        abrirModalAnuncio(false);
    });

    document.getElementById('btn-cerrar-modal-anuncio')?.addEventListener('click', cerrarModalAnuncio);
    document.getElementById('btn-cancelar-modal-anuncio')?.addEventListener('click', cerrarModalAnuncio);

    document.getElementById('modal-anuncio')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-anuncio')) cerrarModalAnuncio();
    });

    // Sincronización en vivo del modal de anuncios al escribir
    ['anc-titulo', 'anc-mensaje', 'anc-badge', 'anc-media-url', 'anc-action-label'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', syncAnuncioLivePreview);
    });

    ['anc-placement', 'anc-media-type', 'anc-active', 'anc-has-audio', 'anc-video-muted'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', syncAnuncioLivePreview);
    });

    // Selector de archivo local para video / imagen de anuncio
    document.getElementById('anc-file-picker')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const isVid = file.type.startsWith('video/');
        const isImg = file.type.startsWith('image/');
        if (isVid) {
            document.getElementById('anc-media-type').value = 'video';
        } else if (isImg) {
            document.getElementById('anc-media-type').value = 'image';
        }

        const objectUrl = URL.createObjectURL(file);
        document.getElementById('anc-media-url').value = objectUrl;
        syncAnuncioLivePreview();
        toast(`Archivo cargado: ${file.name}`, 'success');
    });

    // Guardar anuncio desde el formulario
    document.getElementById('form-anuncio')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const titulo = document.getElementById('anc-titulo')?.value.trim();
        const mensaje = document.getElementById('anc-mensaje')?.value.trim();

        if (!titulo) {
            toast('El título del anuncio es obligatorio', 'warning');
            document.getElementById('anc-titulo')?.focus();
            return;
        }
        if (!mensaje) {
            toast('La descripción del anuncio es obligatoria', 'warning');
            document.getElementById('anc-mensaje')?.focus();
            return;
        }

        const payload = {
            title: titulo,
            message: mensaje,
            placement: document.getElementById('anc-placement')?.value || 'modal',
            badge_text: document.getElementById('anc-badge')?.value.trim() || '',
            media_type: document.getElementById('anc-media-type')?.value || 'none',
            active: document.getElementById('anc-active')?.value === 'true',
            media_url: document.getElementById('anc-media-url')?.value.trim() || '',
            has_audio: Boolean(document.getElementById('anc-has-audio')?.checked),
            video_muted: Boolean(document.getElementById('anc-video-muted')?.checked),
            action_label: document.getElementById('anc-action-label')?.value.trim() || '',
            action_url: document.getElementById('anc-action-url')?.value.trim() || ''
        };

        guardarAnuncio(payload);
    });

    // Filtros de Anuncios en toolbar
    document.getElementById('admin-anc-search')?.addEventListener('input', () => renderAdminAnuncios(getVisibleAnuncios()));
    document.getElementById('admin-anc-filter-placement')?.addEventListener('change', () => renderAdminAnuncios(getVisibleAnuncios()));
    document.getElementById('admin-anc-filter-type')?.addEventListener('change', () => renderAdminAnuncios(getVisibleAnuncios()));
    document.getElementById('admin-anc-filter-status')?.addEventListener('change', () => renderAdminAnuncios(getVisibleAnuncios()));

    document.getElementById('admin-filter-cat')?.addEventListener('change', () => renderRows(getVisibleProducts()));
    document.getElementById('admin-filter-status')?.addEventListener('change', () => renderRows(getVisibleProducts()));
    document.getElementById('btn-export-csv')?.addEventListener('click', () => exportProductsCsv(getVisibleProducts()));
    document.getElementById('btn-bulk-deactivate')?.addEventListener('click', () => bulkSetActive(false));
    document.getElementById('btn-bulk-activate')?.addEventListener('click', () => bulkSetActive(true));

    document.getElementById('btn-reset-analytics')?.addEventListener('click', () => {
        if (confirm('¿Deseas reiniciar las estadísticas reales de visitas y clics a cero?')) {
            window.YogAnalytics?.resetMetrics();
            renderRealAnalytics(allAdminProducts);
            toast('Métricas restablecidas con éxito', 'success');
        }
    });

    window.addEventListener('yoguraso:metrics-updated', () => {
        renderRealAnalytics(allAdminProducts);
    });

    document.getElementById('admin-select-all')?.addEventListener('change', (e) => {
        const checked = e.target.checked;
        getVisibleProducts().forEach((p) => {
            if (checked) selectedIds.add(p.id);
            else selectedIds.delete(p.id);
        });
        renderRows(getVisibleProducts());
    });

    document.querySelectorAll('.admin-sheet th.sortable').forEach((th) => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (!key) return;
            if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            else {
                sortKey = key;
                sortDir = 'asc';
            }
            renderRows(getVisibleProducts());
        });
    });

    search?.addEventListener('input', () => renderRows(getVisibleProducts()));

    btnNuevo?.addEventListener('click', () => {
        limpiarFormulario();
        abrirModal('Nuevo producto', { isEdit: false });
    });

    initAdminStudioEvents();

    const close = () => cerrarModal({ reset: true });
    btnCerrar?.addEventListener('click', close);
    btnCancelar?.addEventListener('click', close);

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') {
            close();
        }
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (guardando) return;

        const token = getToken();
        const submitBtn = document.getElementById('btn-guardar-producto');
        syncLiveCardPreview();
        const payload = payloadDesdeFormulario();

        if (!payload.nombre) {
            toast('El nombre es requerido', 'error');
            document.getElementById('p-nombre')?.focus();
            return;
        }
        if (!Number.isFinite(payload.precio) || payload.precio < 0) {
            toast('Ingresa un precio válido', 'error');
            document.getElementById('p-precio')?.focus();
            return;
        }
        if (!Number.isInteger(payload.stock) || payload.stock < 0) {
            toast('Ingresa un stock válido (entero)', 'error');
            document.getElementById('p-stock')?.focus();
            return;
        }

        guardando = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }

        try {
            const uploadResult = await uploadPendingImage(token);
            if (!uploadResult.success) {
                toast(uploadResult.message || 'No se pudo subir la imagen', 'error');
                return;
            }

            payload.imagen_url = uploadResult.url;

            let res;
            if (editandoId) {
                res = await updateProduct(editandoId, payload, token);
            } else {
                res = await createProduct(payload, token);
            }

            if (!res.success) {
                // Respaldo local resiliente para permitir editar en sesión aun sin conexión remota
                const localIdx = allAdminProducts.findIndex(p => String(p.id) === String(editandoId));
                if (editandoId && localIdx !== -1) {
                    allAdminProducts[localIdx] = { ...allAdminProducts[localIdx], ...payload };
                    toast('Producto actualizado (cambios guardados)', 'success');
                    cerrarModal({ reset: true });
                    renderRows(getVisibleProducts());
                    updateDashboard(allAdminProducts);
                    return;
                }
                toast(res.message || 'No se pudo guardar el producto', 'error');
                return;
            }

            toast(editandoId ? 'Producto actualizado' : 'Producto creado', 'success');
            cerrarModal({ reset: true });
            await cargarTablaProductos();
        } finally {
            guardando = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                setSubmitLabel(Boolean(editandoId));
            }
        }
    });
}

function setupAdminSubnav() {
    const links = [...document.querySelectorAll('.admin-subnav-link')];
    if (!links.length) return;

    const sync = () => {
        const hash = (window.location.hash || '#productos').toLowerCase();
        links.forEach((a) => {
            const href = (a.getAttribute('href') || '').toLowerCase();
            a.classList.toggle('is-on', href === hash);
        });
    };

    links.forEach((a) => a.addEventListener('click', () => {
        links.forEach((el) => el.classList.remove('is-on'));
        a.classList.add('is-on');
    }));
    window.addEventListener('hashchange', sync);
    sync();
}

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = getUsuario();
    const token = getToken();

    if (!token || !usuario || usuario.rol !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Permite continuar si usuario local o base validan el rol de admin
    const isAdmin = await verifyAdmin();
    if (!isAdmin && usuario.rol !== 'admin') {
        const { session } = await syncSession();
        window.location.href = session ? '../index.html' : 'login.html';
        return;
    }

    setupAdminSubnav();
    setupImageUpload();
    setupAdminEvents();
    await cargarTablaProductos();
    await cargarTablaUsuarios();
    await cargarTablaPreguntas();
    await cargarTablaAnuncios();
    window.Cart?.updateCounter();
});
