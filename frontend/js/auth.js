/**
 * auth.js — Login, registro, sesión y roles
 * - Guarda token + usuario en localStorage
 * - Admin → panel; cliente → tienda
 * - Actualiza el dropdown del menú de usuario (header)
 */
import { login, register } from './api.js';

const isInPages = window.location.pathname.includes('/pages/');
const HOME_PATH = isInPages ? '../index.html' : 'index.html';
const ADMIN_PATH = isInPages ? 'admin.html' : 'pages/admin.html';
const LOGIN_PATH = isInPages ? 'login.html' : 'pages/login.html';
const pageName = window.location.pathname.split('/').pop() || '';

function showMessage(message, type = 'info') {
    if (window.YogurUtils?.showToast) {
        window.YogurUtils.showToast(message, type);
        return;
    }
    if (window.Cart?.showToast) {
        window.Cart.showToast(message, type);
        return;
    }
}

function getUsuario() {
    try {
        return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
        return null;
    }
}

function getToken() {
    return localStorage.getItem('token');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    showMessage('Sesión cerrada', 'info');
    setTimeout(() => {
        window.location.href = HOME_PATH;
    }, 350);
}

function redirectIfAuthenticatedOnAuthPages() {
    const usuario = getUsuario();
    const token = getToken();
    if (!usuario || !token) return;

    const isAuthPage = pageName === 'login.html' || pageName === 'registro.html';
    if (!isAuthPage) return;

    window.location.href = usuario.rol === 'admin' ? ADMIN_PATH : HOME_PATH;
}

function protectAdminPage() {
    if (pageName !== 'admin.html') return;

    const usuario = getUsuario();
    const token = getToken();

    if (!token || !usuario || usuario.rol !== 'admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = LOGIN_PATH;
    }
}

function setupUserDropdown() {
    const menuBtn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');
    const usuario = getUsuario();

    if (menuBtn && dropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => dropdown.classList.remove('show'));
    }

    if (!dropdown) return;

    if (usuario && getToken()) {
        const accountLink = usuario.rol === 'admin'
            ? `<a href="${ADMIN_PATH}" class="dropdown-item"><i class="fas fa-user-shield"></i> Panel Admin</a>`
            : `<a href="${isInPages ? 'carrito.html' : 'pages/carrito.html'}" class="dropdown-item"><i class="fas fa-shopping-bag"></i> Mi carrito</a>`;

        dropdown.innerHTML = `
            ${accountLink}
            <a href="#" class="dropdown-item" id="logout-link">
                <i class="fas fa-sign-out-alt"></i>
                Cerrar sesión
            </a>
        `;

        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const submitBtn = loginForm.querySelector('[type="submit"]');

        if (!email || !password) {
            showMessage('Email y contraseña son requeridos', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Ingresando...';
        }

        const result = await login(email, password);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar Sesión';
        }

        if (!result.success) {
            showMessage(result.message || 'Error al iniciar sesión', 'error');
            return;
        }

        localStorage.setItem('token', result.token);
        localStorage.setItem('usuario', JSON.stringify(result.usuario));
        sessionStorage.setItem('yogur_just_logged_in', '1');

        window.location.href = result.usuario.rol === 'admin' ? ADMIN_PATH : HOME_PATH;
    });
}

function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const confirm = document.getElementById('confirm-password')?.value;
        const submitBtn = registerForm.querySelector('[type="submit"]');

        if (!nombre || !email || !password) {
            showMessage('Completa todos los campos', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showMessage('Ingresa un correo válido', 'error');
            return;
        }

        if (password !== confirm) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
        }

        if ((password || '').length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registrando...';
        }

        const result = await register({ nombre, email, password });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Cuenta';
        }

        if (!result.success) {
            showMessage(result.message || 'Error en el registro', 'error');
            return;
        }

        if (result.token && result.usuario) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('usuario', JSON.stringify(result.usuario));
            sessionStorage.setItem('yogur_just_logged_in', '1');
            window.location.href = HOME_PATH;
            return;
        }

        showMessage('Registro exitoso. Ahora puedes iniciar sesión', 'success');
        window.location.href = LOGIN_PATH;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    protectAdminPage();
    redirectIfAuthenticatedOnAuthPages();
    setupUserDropdown();
    setupLoginForm();
    setupRegisterForm();
});
