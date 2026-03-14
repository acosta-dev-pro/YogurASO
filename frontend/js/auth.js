import { login, register, getProfile } from './api.js';
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('registro-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const result = await login(email, password);
            if (result.success) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('usuario', JSON.stringify(result.usuario));
                alert('¡Bienvenido!');
                window.location.href = result.usuario.rol === 'admin' ? 'admin.html' : '../index.html';
            } else alert(result.message || 'Error al iniciar sesión');
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const result = await register({ nombre, email, password });
            if (result.success) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('usuario', JSON.stringify(result.usuario));
                alert('Registro exitoso');
                window.location.href = 'login.html';
            } else alert(result.message || 'Error en el registro');
        });
    }
});
export function actualizarNavbar() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const userLinks = document.querySelector('.nav-links');
    if (usuario && userLinks) {
        const loginLink = userLinks.querySelector('a[href*="login.html"]');
        if (loginLink) {
            const li = loginLink.parentElement;
            li.innerHTML = <div class="user-menu"><span class="user-name">Hola, </span><button id="btn-logout-main" class="btn-logout-small">Salir</button></div>;
            document.getElementById('btn-logout-main').onclick = () => { localStorage.clear(); window.location.reload(); };
        }
    }
}
actualizarNavbar();
