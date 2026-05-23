/**
 * admin/ui.js — Utilidades de interfaz del panel: texto seguro, toasts, confirmaciones, formato de precio y sesión.
 */

/** Funciones auxiliares de formato y notificaciones */
export const escapeHtml = (v) => window.YogurUtils?.escapeHtml(v) || String(v ?? '');

export const toast = (msg, type = 'success') => window.YogurUtils?.showToast?.(msg, type);

export const confirmAction = (opts) => window.YogurUtils?.confirmAction?.(opts);

export const formatCOP = (n) => window.YogurUtils?.formatCOP?.(n) || ('$' + Number(n || 0).toLocaleString('es-CO'));

export function getToken() {
    return localStorage.getItem('token');
}

export function getUsuario() {
    try {
        return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
        return null;
    }
}
