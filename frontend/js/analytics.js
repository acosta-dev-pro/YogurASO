/**
 * Métricas de visitas, clics en productos y pedidos por WhatsApp.
 * Los datos se guardan en localStorage.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'yoguraso_real_metrics_v1';
    const SESSION_KEY = 'yoguraso_session_active';

    /**
     * Estructura base para cuando el sistema inicia desde cero.
     */
    function getDefaultMetrics() {
        return {
            totalVisits: 0,
            totalOrders: 0,
            devices: {
                ios: 0,
                android: 0,
                desktop: 0
            },
            visitsByDay: {},
            productClicks: {} // { [productId]: { id, nombre, clicks, inspections, cartAdds } }
        };
    }

    /**
     * Carga las métricas guardadas de forma segura.
     */
    function loadMetrics() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return getDefaultMetrics();
            const data = JSON.parse(raw);
            return {
                totalVisits: Number(data.totalVisits) || 0,
                totalOrders: Number(data.totalOrders) || 0,
                devices: {
                    ios: Number(data.devices?.ios) || 0,
                    android: Number(data.devices?.android) || 0,
                    desktop: Number(data.devices?.desktop) || 0
                },
                visitsByDay: data.visitsByDay || {},
                productClicks: data.productClicks || {}
            };
        } catch (e) {
            console.warn('[YogurASO Analytics] Error al leer métricas:', e);
            return getDefaultMetrics();
        }
    }

    /**
     * Guarda las métricas actualizadas y dispara el evento en tiempo real.
     */
    function saveMetrics(metrics) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
            window.dispatchEvent(new CustomEvent('yoguraso:metrics-updated', { detail: metrics }));
        } catch (e) {
            console.warn('[YogurASO Analytics] No se pudo guardar en almacenamiento local:', e);
        }
    }

    /**
     * Detecta el tipo de dispositivo de manera sencilla y natural.
     */
    function getDeviceType() {
        const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
        if (/iphone|ipad|ipod/.test(ua)) return 'ios';
        if (/android/.test(ua)) return 'android';
        return 'desktop';
    }

    /**
     * Registra una visita real en la página actual.
     * Evita contar múltiples veces si el usuario recarga la misma pestaña dentro de la misma sesión.
     */
    function trackPageView() {
        const isSessionActive = sessionStorage.getItem(SESSION_KEY);
        const metrics = loadMetrics();
        const today = new Date().toISOString().slice(0, 10);

        if (!isSessionActive) {
            // Nueva sesión o visitante nuevo
            sessionStorage.setItem(SESSION_KEY, '1');
            metrics.totalVisits += 1;

            const dev = getDeviceType();
            metrics.devices[dev] = (metrics.devices[dev] || 0) + 1;

            metrics.visitsByDay[today] = (metrics.visitsByDay[today] || 0) + 1;
            saveMetrics(metrics);
        }
    }

    /**
     * Registra una interacción real sobre una tarjeta o ficha de producto.
     * @param {string|number} productId - Identificador del producto
     * @param {string} productName - Nombre legible del producto
     * @param {'click'|'inspect'|'cart'} action - Tipo de acción realizada
     */
    function trackProductClick(productId, productName, action = 'click') {
        if (!productId) return;
        const key = String(productId).trim();
        const metrics = loadMetrics();

        if (!metrics.productClicks[key]) {
            metrics.productClicks[key] = {
                id: key,
                nombre: productName || `Producto #${key}`,
                clicks: 0,
                inspections: 0,
                cartAdds: 0,
                lastInteraction: new Date().toISOString()
            };
        }

        const item = metrics.productClicks[key];
        if (productName && (!item.nombre || item.nombre.startsWith('Producto #'))) {
            item.nombre = productName;
        }

        if (action === 'inspect') {
            item.inspections = (item.inspections || 0) + 1;
        } else if (action === 'cart') {
            item.cartAdds = (item.cartAdds || 0) + 1;
        } else {
            item.clicks = (item.clicks || 0) + 1;
        }
        item.lastInteraction = new Date().toISOString();

        saveMetrics(metrics);
    }

    /**
     * Registra un clic en pedido por WhatsApp.
     */
    function trackOrder() {
        const metrics = loadMetrics();
        metrics.totalOrders = (metrics.totalOrders || 0) + 1;
        saveMetrics(metrics);
    }

    /**
     * Limpia las métricas si el administrador desea reiniciar el contador.
     */
    function resetMetrics() {
        const empty = getDefaultMetrics();
        saveMetrics(empty);
        sessionStorage.removeItem(SESSION_KEY);
        return empty;
    }

    /**
     * Delegación automática de eventos:
     * Escucha clics naturales en tarjetas de producto, botones de WhatsApp y fichas.
     */
    function setupAutoListeners() {
        document.addEventListener('click', function (e) {
            // 1. Clic en tarjeta de producto
            const card = e.target.closest('.hp-card, .producto-card, [data-producto-card]');
            if (card) {
                const id = card.dataset.id || card.dataset.slug;
                const nameEl = card.querySelector('.hp-card__title, .producto-titulo, h3, h4');
                const name = nameEl ? nameEl.textContent.trim() : card.dataset.slug || id;

                // Si fue clic en añadir al carrito
                if (e.target.closest('[data-hp-add], .btn-add')) {
                    trackProductClick(id, name, 'cart');
                } else if (e.target.closest('[data-hp-open], [data-ficha], .btn-ficha')) {
                    trackProductClick(id, name, 'inspect');
                } else {
                    trackProductClick(id, name, 'click');
                }
            }

            // 2. Clic en pedidos por WhatsApp
            const waBtn = e.target.closest('[data-config="whatsapp"], .checkout-btn, a[href*="wa.me"], a[href*="whatsapp.com"]');
            if (waBtn) {
                trackOrder();
            }
        }, { passive: true });
    }

    // Inicializar al cargar el documento
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            trackPageView();
            setupAutoListeners();
        });
    } else {
        trackPageView();
        setupAutoListeners();
    }

    // Exponer API global limpia y humana
    window.YogAnalytics = {
        getMetrics: loadMetrics,
        trackProductClick: trackProductClick,
        trackOrder: trackOrder,
        resetMetrics: resetMetrics,
        trackPageView: trackPageView
    };
})();
