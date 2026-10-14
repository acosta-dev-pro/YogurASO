/**
 * auth-comun.js — Rutas de las páginas, avisos y sesión en pantalla.
 * La sesión real la guarda Supabase; localStorage solo pinta el menú.
 */
import { logout as apiLogout, syncSession } from './api.js';

export const isInPages = window.location.pathname.includes('/pages/');
export const HOME_PATH = isInPages ? '../index.html' : 'index.html';
export const ADMIN_PATH = isInPages ? 'admin.html' : 'pages/admin.html';
export const LOGIN_PATH = isInPages ? 'login.html' : 'pages/login.html';
export const REGISTER_PATH = isInPages ? 'registro.html' : 'pages/registro.html';
export const PROFILE_PATH = isInPages ? 'perfil.html' : 'pages/perfil.html';
export const pageName = (window.location.pathname.split('/').pop() || '').split('?')[0];

// Códigos del correo: Supabase usa 6 a 10 dígitos según "Email OTP length"
// (los proyectos nuevos suelen mandar 8). Se aceptan todos y se quitan espacios.
export const cleanCode = (v) => String(v || '').replace(/\D/g, '');
export const isCode = (v) => /^\d{6,10}$/.test(cleanCode(v));

/** Los campos de código del HTML traen maxlength="6": se amplían para no cortar códigos de 8. */
export function relaxCodeInputs() {
    ['codigo', 'password-codigo', 'signup-code'].forEach((id) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.setAttribute('maxlength', '12');
        input.removeAttribute('pattern');
        if (/^0+$/.test(input.getAttribute('placeholder') || '')) input.setAttribute('placeholder', 'Código del correo');
    });
}
export const isProfilePage = () =>
    document.body.classList.contains('profile-page') || /^perfil\.html$/i.test(pageName);

export function showMessage(message, type = 'info') {
    if (window.YogurUtils?.showToast) {
        window.YogurUtils.showToast(message, type);
        return;
    }
    if (window.Cart?.showToast) {
        window.Cart.showToast(message, type);
    }
}

export async function askConfirm(opts) {
    if (window.YogurUtils?.confirmAction) return window.YogurUtils.confirmAction(opts);
    return window.confirm(opts.message || '¿Continuar?');
}

export async function askAlert(opts) {
    if (window.YogurUtils?.alertAction) return window.YogurUtils.alertAction(opts);
    window.alert(opts.message || opts.title || '');
    return true;
}

export function getUsuario() {
    try {
        return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
        return null;
    }
}

export function getToken() {
    return localStorage.getItem('token');
}

export function saveSession(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    sessionStorage.setItem('yogur_just_logged_in', '1');
}

export async function logout() {
    const ok = await askConfirm({
        title: 'Cerrar sesión',
        message: '¿Seguro que deseas salir de tu cuenta YogurASO?',
        confirmText: 'Sí, cerrar sesión',
        cancelText: 'No, quedarme',
        danger: true,
        type: 'warning'
    });
    if (!ok) {
        showMessage('Sigues con la sesión activa', 'info');
        return;
    }

    await apiLogout();
    showMessage('Sesión cerrada correctamente', 'success');
    setTimeout(() => {
        window.location.href = HOME_PATH;
    }, 400);
}

export async function redirectIfAuthenticatedOnAuthPages() {
    // reset-password.html queda fuera: ahí se usa la sesión temporal de recuperación.
    const isAuthPage = ['login.html', 'registro.html', 'recuperar.html'].includes(pageName);
    if (!isAuthPage) return;

    const { session, usuario } = await syncSession();
    if (!session || !usuario) return;
    if (usuario.activo === false) {
        await apiLogout();
        return;
    }
    window.location.href = usuario.rol === 'admin' ? ADMIN_PATH : HOME_PATH;
}

export function protectAdminPage() {
    if (pageName !== 'admin.html') return;

    const usuario = getUsuario();
    const token = getToken();

    if (!token || !usuario || usuario.rol !== 'admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = LOGIN_PATH;
    }
}

export function protectProfilePage() {
    if (!isProfilePage()) return;
    if (!getToken() || !getUsuario()) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = LOGIN_PATH;
        return;
    }
    // El espejo local puede ser viejo: confirmar con Supabase.
    syncSession().then(({ session, offline }) => {
        if (!session && !offline) window.location.href = LOGIN_PATH;
    });
}

export function isLoggedIn() {
    return Boolean(getToken() && getUsuario());
}
