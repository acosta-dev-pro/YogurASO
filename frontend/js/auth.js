import { login, register } from './api.js';

const isInPages = window.location.pathname.includes('/pages/');
const HOME_PATH = isInPages ? '../index.html' : 'index.html';
const ADMIN_PATH = isInPages ? 'admin.html' : 'pages/admin.html';

function showMessage(message) {
    alert(message);
}

function setupUserDropdown() {
    const menuBtn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

    if (menuBtn && dropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => dropdown.classList.remove('show'));
    }

    if (!dropdown) return;

    if (usuario) {
        dropdown.innerHTML = `
            <a href="${usuario.rol === 'admin' ? ADMIN_PATH : HOME_PATH}" class="dropdown-item">
                <i class="fas fa-user-check"></i>
                ${usuario.rol === 'admin' ? 'Panel Admin' : 'Mi cuenta'}
            </a>
            <a href="#" class="dropdown-item" id="logout-link">
                <i class="fas fa-sign-out-alt"></i>
                Cerrar sesión
            </a>
        `;

        const logout = document.getElementById('logout-link');
        if (logout) {
            logout.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                window.location.href = HOME_PATH;
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

        const result = await login(email, password);
        if (!result.success) {
            showMessage(result.message || 'Error al iniciar sesión');
            return;
        }

        localStorage.setItem('token', result.token);
        localStorage.setItem('usuario', JSON.stringify(result.usuario));

        showMessage(`Bienvenido ${result.usuario.nombre}`);
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

        if (password !== confirm) {
            showMessage('Las contraseñas no coinciden');
            return;
        }

        if ((password || '').length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        const result = await register({ nombre, email, password });
        if (!result.success) {
            showMessage(result.message || 'Error en el registro');
            return;
        }

        showMessage('Registro exitoso. Ahora puedes iniciar sesión');
        window.location.href = isInPages ? 'login.html' : 'pages/login.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupUserDropdown();
    setupLoginForm();
    setupRegisterForm();
});
