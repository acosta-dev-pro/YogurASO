/**
 * admin/formulario.js — Modal de producto: abrir/cerrar, limpiar, llenar y construir el payload; subida de imagen del producto.
 */
import { state } from './state.js';
import { uploadImage } from '../api.js';
import { imgSrc, categoriaMap, FLAVOR_PALETTES } from './constants.js';
import { toast } from './ui.js';
import { normalizeBottleImage, compressProductFileToDataUrl } from './imagen.js';
import { colorClaro, colorElegido, syncLiveCardPreview, updateDiscountCalculator, setLetreroType, setBadgeColorActive } from './estudio-color.js';

export function calcularSlugProducto(nombre) {
    if (!nombre) return 'fresa';
    const raw = String(nombre)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    for (const slug of Object.keys(FLAVOR_PALETTES)) {
        if (raw === slug || raw.includes(slug)) return slug;
    }
    return raw || 'producto';
}

export function setSubmitLabel(isEdit) {
    const btn = document.getElementById('btn-guardar-producto');
    if (btn) btn.textContent = isEdit ? 'Guardar cambios' : 'Crear producto';
}

export function abrirModal(titulo, { isEdit = false } = {}) {
    const modal = document.getElementById('modal-producto');
    const title = document.getElementById('modal-title');
    const hint = document.getElementById('modal-hint');
    const eyebrow = document.getElementById('modal-eyebrow');

    if (title) title.textContent = titulo;
    if (eyebrow) eyebrow.textContent = isEdit ? 'Edición' : 'Alta';
    if (hint) {
        hint.textContent = isEdit
            ? 'Actualiza precio, stock, imagen o color del producto con sincronización automática.'
            : 'Elige un color para sincronizar automáticamente los tonos de la web y la tarjeta.';
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
            document.getElementById('p-nombre')?.focus();
        }, 40);
        syncLiveCardPreview();
    }
}

export function cerrarModal({ reset = true } = {}) {
    const modal = document.getElementById('modal-producto');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
    if (reset) limpiarFormulario();
}

export function limpiarFormulario() {
    state.editandoId = null;
    state.guardando = false;
    document.getElementById('form-producto')?.reset();

    const idInput = document.getElementById('p-id');
    if (idInput) idInput.value = '';
    const activo = document.getElementById('p-activo');
    if (activo) {
        if (activo.type === 'checkbox') activo.checked = true;
        else activo.value = 'true';
    }
    const categoria = document.getElementById('p-categoria');
    if (categoria) categoria.value = 'Frutales';
    const colorDark = document.getElementById('p-color-dark');
    if (colorDark) colorDark.value = '#C3343E';
    const colorDarkText = document.getElementById('p-color-dark-text');
    if (colorDarkText) colorDarkText.value = '#C3343E';

    setLetreroType('');
    setBadgeColorActive('#D62300');

    document.querySelectorAll('#adminShapePills .shape-pill').forEach((p, idx) => p.classList.toggle('is-active', idx === 0));
    const shapeInput = document.getElementById('p-letrero-forma');
    if (shapeInput) shapeInput.value = 'pill';

    resetImageUpload();
    setSubmitLabel(false);
    updateDiscountCalculator('percent');
    syncLiveCardPreview();
}

export function resetImageUpload() {
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

export function setImagePreview(url) {
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

export function setupImageUpload() {
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
        syncLiveCardPreview();
    });
}

export async function handleFileSelected(file, hiddenInput) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
        toast('Solo se permiten imágenes JPG, PNG, WEBP o GIF', 'error');
        return;
    }
    if (file.size > 8 * 1024 * 1024) {
        toast('La imagen no puede superar 8 MB', 'error');
        return;
    }

    const normalized = await normalizeBottleImage(file);
    if (normalized && normalized.dataUrl) {
        setImagePreview(normalized.dataUrl);
        if (hiddenInput) {
            hiddenInput.value = normalized.dataUrl;
            hiddenInput._pendingFile = normalized.blob || file;
        }
        syncLiveCardPreview();
    } else {
        const compressedDataUrl = await compressProductFileToDataUrl(file);
        if (compressedDataUrl) {
            setImagePreview(compressedDataUrl);
            if (hiddenInput) {
                hiddenInput.value = compressedDataUrl;
                hiddenInput._pendingFile = file;
            }
            syncLiveCardPreview();
        }
    }
}

export async function uploadPendingImage(token) {
    const hiddenInput = document.getElementById('p-imagen');
    if (!hiddenInput?._pendingFile) return { success: true, url: hiddenInput?.value || '' };

    const data = await uploadImage(hiddenInput._pendingFile, token);
    if (data.success && data.url) {
        hiddenInput.value = data.url;
        hiddenInput._pendingFile = null;
        return { success: true, url: data.url };
    }
    if (hiddenInput.value && hiddenInput.value.startsWith('data:')) {
        hiddenInput._pendingFile = null;
        return { success: true, url: hiddenInput.value };
    }
    return { success: false, message: data.message || 'Error al subir la imagen' };
}

export function payloadDesdeFormulario() {
    const categoriaKey = document.getElementById('p-categoria')?.value || 'Frutales';
    const letrero = document.getElementById('p-letrero')?.value.trim() || '';
    const tipoLetrero = document.getElementById('p-letrero-tipo')?.value || '';
    const nombreVal = document.getElementById('p-nombre')?.value.trim() || '';
    const slug = calcularSlugProducto(nombreVal);
    const defaultBottle = 'assets/products/yoguraso-fresa-500ml-sm.webp';
    const rawImg = document.getElementById('p-imagen')?.value.trim() || '';
    const colorDark = colorElegido();
    const finalLight = colorClaro(colorDark);

    return {
        nombre: nombreVal,
        slug: slug,
        precio: Number(document.getElementById('p-precio')?.value || 0),
        precio_1l: Number(document.getElementById('p-precio-1l')?.value || 0),
        stock: Number(document.getElementById('p-stock')?.value || 0),
        descripcion: document.getElementById('p-descripcion')?.value.trim() || '',
        imagen_url: rawImg || defaultBottle,
        categoria: categoriaMap[categoriaKey] || categoriaKey || 'Frutales',
        color_fondo: finalLight,
        color_dark: colorDark,
        color_light: finalLight,
        color_acento: document.getElementById('p-color-acento')?.value || '#D62300',
        letrero_forma: document.getElementById('p-letrero-forma')?.value || 'pill',
        activo: document.getElementById('p-activo')?.type === 'checkbox'
            ? Boolean(document.getElementById('p-activo')?.checked)
            : (document.getElementById('p-activo')?.value !== 'false'),
        letrero,
        letrero_tipo: letrero ? tipoLetrero : '',
        descuento: Number(document.getElementById('p-descuento')?.value || 0)
    };
}

export function llenarFormulario(producto) {
    if (!producto) return;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    };

    setVal('p-id', producto.id);
    setVal('p-nombre', producto.nombre || '');
    setVal('p-precio', producto.precio ?? 0);
    setVal('p-precio-1l', producto.precio_1l || '');
    setVal('p-stock', producto.stock ?? 0);
    setVal('p-descripcion', producto.descripcion || '');
    setVal('p-imagen', producto.imagen_url || '');
    if (producto.imagen_url) {
        setImagePreview(imgSrc(producto.imagen_url));
    } else {
        resetImageUpload();
    }

    // Seleccionar categoría real del producto
    const catSelect = document.getElementById('p-categoria');
    let categoriaKey = Object.keys(categoriaMap).find(
        (key) => key.toLowerCase() === String(producto.categoria || '').toLowerCase()
            || categoriaMap[key].toLowerCase() === String(producto.categoria || '').toLowerCase()
    );
    if (!categoriaKey && producto.categoria && catSelect) {
        categoriaKey = producto.categoria;
        categoriaMap[categoriaKey] = producto.categoria;
        if (!catSelect.querySelector(`option[value="${CSS.escape(categoriaKey)}"]`)) {
            const opt = document.createElement('option');
            opt.value = categoriaKey;
            opt.textContent = producto.categoria;
            catSelect.appendChild(opt);
        }
    }
    if (catSelect) catSelect.value = categoriaKey || 'Frutales';

    // Colores según el sabor real del producto
    const slug = calcularSlugProducto(producto.nombre);
    const flavorPalette = FLAVOR_PALETTES[slug] || FLAVOR_PALETTES.fresa;

    const colorDark = /^#[0-9A-Fa-f]{6}$/.test(producto.color_dark || '')
        ? producto.color_dark
        : flavorPalette.dark;
    const colorDarkEl = document.getElementById('p-color-dark');
    if (colorDarkEl) colorDarkEl.value = colorDark;
    const darkHexText = document.getElementById('p-color-dark-text');
    if (darkHexText) darkHexText.value = colorDark.toUpperCase();

    const activoEl = document.getElementById('p-activo');
    if (activoEl) {
        if (activoEl.type === 'checkbox') activoEl.checked = Boolean(producto.activo);
        else activoEl.value = producto.activo ? 'true' : 'false';
    }

    const tipo = producto.letrero_tipo || '';
    const texto = producto.letrero || '';
    const desc = Number(producto.descuento || 0);
    const colorAcento = /^#[0-9A-Fa-f]{6}$/.test(producto.color_acento || '') ? producto.color_acento : '#D62300';
    const forma = producto.letrero_forma || 'pill';

    setLetreroType(tipo || (desc > 0 ? 'descuento' : (texto ? 'personalizado' : '')));
    setVal('p-letrero', texto);
    setVal('p-descuento', desc);
    setBadgeColorActive(colorAcento);

    const shapeInput = document.getElementById('p-letrero-forma');
    if (shapeInput) shapeInput.value = forma;
    document.querySelectorAll('#adminShapePills .shape-pill').forEach((btn) => {
        btn.classList.toggle('is-active', (btn.dataset.shape || 'pill') === forma);
    });

    updateDiscountCalculator('percent');
    syncLiveCardPreview();
}
