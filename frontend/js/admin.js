/**
 * Panel de administración: eventos y navegación entre pestañas.
 * La lógica de cada pestaña está en js/admin/.
 */
import { state, selectedIds } from './admin/state.js';
import { createProduct, updateProduct, verifyAdmin, syncSession } from './api.js';
import { toast, getToken, getUsuario } from './admin/ui.js';
import { syncLiveCardPreview, initAdminStudioEvents } from './admin/estudio-color.js';
import { setSubmitLabel, abrirModal, cerrarModal, limpiarFormulario, setupImageUpload, uploadPendingImage, payloadDesdeFormulario } from './admin/formulario.js';
import { getVisibleProducts, exportProductsCsv, renderRows, bulkSetActive, cargarTablaProductos } from './admin/inventario.js';
import { renderStockAlerts } from './admin/stock.js';
import { getVisibleUsers, renderUserRows, cargarTablaUsuarios, renderRealAnalytics } from './admin/tab-usuarios.js';
import { STORAGE_IX_KEY, LEGACY_IX_KEY, cargarTablaPreguntas, getVisibleQuestions, renderAdminQuestions } from './admin/tab-preguntas.js';
import { contarPedidos } from './admin/data.js';
import { actualizarVistaPreviaAnuncios, cargarConfiguracionAnuncios, guardarConfiguracionAnuncios, manejarSubidaArchivoMultimedia, ajustarUrlPorTipo, aplicarPreset, probarLetrero } from './admin/tab-anuncios.js';

function setupAdminSubnav() {
    const btns = [...document.querySelectorAll('.admin-subnav-btn')];
    const panes = [...document.querySelectorAll('.admin-tab-pane')];
    if (!btns.length) return;

    function selectTab(tabId) {
        btns.forEach((btn) => btn.classList.toggle('is-on', btn.dataset.tab === tabId));
        panes.forEach((pane) => pane.classList.toggle('is-active', pane.id === tabId));
    }

    btns.forEach((btn) => {
        btn.addEventListener('click', () => selectTab(btn.dataset.tab));
    });
}

function setupAdminEvents() {
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    const modal = document.getElementById('modal-producto');
    const form = document.getElementById('form-producto');
    const search = document.getElementById('admin-search');

    // Filtro en vivo de Alertas de Stock
    document.getElementById('admin-alerts-filter')?.addEventListener('change', () => {
        renderStockAlerts(state.products);
    });

    // Portada de inicio y ventana de bienvenida (se publican en Supabase al pulsar Guardar)
    document.getElementById('form-cfg-anuncios')?.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarConfiguracionAnuncios();
    });
    document.getElementById('btn-guardar-cfg-anuncios')?.addEventListener('click', () => {
        guardarConfiguracionAnuncios();
    });
    document.getElementById('btn-probar-letrero')?.addEventListener('click', probarLetrero);

    ['inicio', 'letrero'].forEach((target) => {
        document.getElementById(`cfg-${target}-tipo`)?.addEventListener('change', () => {
            ajustarUrlPorTipo(target);
            actualizarVistaPreviaAnuncios();
        });
        document.getElementById(`cfg-${target}-url`)?.addEventListener('input', actualizarVistaPreviaAnuncios);
        document.getElementById(`cfg-${target}-file`)?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) manejarSubidaArchivoMultimedia(file, target);
            e.target.value = '';
        });
    });

    document.querySelectorAll('.admin-preset-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            aplicarPreset(chip.dataset.target === 'inicio' ? 'inicio' : 'letrero', chip.dataset.type || 'imagen', chip.dataset.url || '');
            toast('Multimedia seleccionada. Pulsa Guardar para publicarla.', 'success');
        });
    });

    // Usuarios y Preguntas
    document.getElementById('btn-reload-users')?.addEventListener('click', () => cargarTablaUsuarios());
    document.getElementById('admin-user-search')?.addEventListener('input', () => renderUserRows(getVisibleUsers()));
    document.getElementById('btn-reload-questions')?.addEventListener('click', () => cargarTablaPreguntas());
    document.getElementById('admin-q-search')?.addEventListener('input', () => renderAdminQuestions(getVisibleQuestions()));
    document.getElementById('admin-q-filter')?.addEventListener('change', () => renderAdminQuestions(getVisibleQuestions()));

    // Sincronización entre pestañas (preguntas y productos)
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_IX_KEY || e.key === LEGACY_IX_KEY) {
            cargarTablaPreguntas();
        }
        if (e.key === 'yog_products_sync_v1') {
            cargarTablaProductos();
        }
    });

    // Filtros y acciones en bloque de Inventario
    document.getElementById('admin-filter-cat')?.addEventListener('change', () => renderRows(getVisibleProducts()));
    document.getElementById('admin-filter-status')?.addEventListener('change', () => renderRows(getVisibleProducts()));
    document.getElementById('btn-export-csv')?.addEventListener('click', () => exportProductsCsv(getVisibleProducts()));
    document.getElementById('btn-bulk-deactivate')?.addEventListener('click', () => bulkSetActive(false));
    document.getElementById('btn-bulk-activate')?.addEventListener('click', () => bulkSetActive(true));

    document.getElementById('btn-reset-analytics')?.addEventListener('click', () => {
        if (confirm('¿Deseas reiniciar las estadísticas reales de visitas y clics a cero?')) {
            window.YogAnalytics?.resetMetrics();
            renderRealAnalytics(state.products);
            toast('Métricas restablecidas con éxito', 'success');
        }
    });

    window.addEventListener('yoguraso:metrics-updated', () => {
        renderRealAnalytics(state.products);
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
            if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            else {
                state.sortKey = key;
                state.sortDir = 'asc';
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
        if (state.guardando) return;

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

        state.guardando = true;
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

            const res = state.editandoId
                ? await updateProduct(state.editandoId, payload, token)
                : await createProduct(payload, token);

            if (!res.success) {
                toast(res.message || 'No se pudo guardar el producto', 'error');
                return;
            }

            toast(state.editandoId ? 'Producto actualizado y sincronizado con la tienda' : 'Producto creado con éxito', 'success');
            cerrarModal({ reset: true });
            await cargarTablaProductos();
        } finally {
            state.guardando = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                setSubmitLabel(Boolean(state.editandoId));
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = getUsuario();
    const token = getToken();

    if (!token || !usuario || usuario.rol !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

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
    contarPedidos().then((n) => {
        const el = document.getElementById('stat-pedidos');
        if (el && n !== null) el.textContent = String(n);
    });
    cargarConfiguracionAnuncios();
    window.Cart?.updateCounter();
});
