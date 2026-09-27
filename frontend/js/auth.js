/**
 * auth.js — Login, registro, Google, perfil y recuperar clave.
 * El token se guarda en localStorage (así lo lee api.js en cada petición).
 */
import {
    login,
    register,
    requestPasswordReset,
    resetPassword,
    getProfile,
    updateProfile,
    changePassword,
    requestPasswordChangeCode,
    loginWithGoogle
} from './api.js';

const isInPages = window.location.pathname.includes('/pages/');
const HOME_PATH = isInPages ? '../index.html' : 'index.html';
const ADMIN_PATH = isInPages ? 'admin.html' : 'pages/admin.html';
const LOGIN_PATH = isInPages ? 'login.html' : 'pages/login.html';
const PROFILE_PATH = isInPages ? 'perfil.html' : 'pages/perfil.html';
const pageName = (window.location.pathname.split('/').pop() || '').split('?')[0];
const isProfilePage = () =>
    document.body.classList.contains('profile-page') || /^perfil\.html$/i.test(pageName);

function showMessage(message, type = 'info') {
    if (window.YogurUtils?.showToast) {
        window.YogurUtils.showToast(message, type);
        return;
    }
    if (window.Cart?.showToast) {
        window.Cart.showToast(message, type);
    }
}

async function askConfirm(opts) {
    if (window.YogurUtils?.confirmAction) return window.YogurUtils.confirmAction(opts);
    return window.confirm(opts.message || '¿Continuar?');
}

async function askAlert(opts) {
    if (window.YogurUtils?.alertAction) return window.YogurUtils.alertAction(opts);
    window.alert(opts.message || opts.title || '');
    return true;
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

function saveSession(token, usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    sessionStorage.setItem('yogur_just_logged_in', '1');
}

async function logout() {
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

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    showMessage('Sesión cerrada correctamente', 'success');
    setTimeout(() => {
        window.location.href = HOME_PATH;
    }, 400);
}

function redirectIfAuthenticatedOnAuthPages() {
    const usuario = getUsuario();
    const token = getToken();
    if (!usuario || !token) return;

    const isAuthPage = ['login.html', 'registro.html', 'recuperar.html', 'reset-password.html'].includes(pageName);
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

function protectProfilePage() {
    if (!isProfilePage()) return;
    if (!getToken() || !getUsuario()) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = LOGIN_PATH;
    }
}

function isLoggedIn() {
    return Boolean(getToken() && getUsuario());
}

function setupFooterAuthLinks() {
    const logged = isLoggedIn();
    const usuario = getUsuario();

    document.querySelectorAll('.site-footer a[href*="login.html"], .site-footer a[href*="registro.html"]').forEach((link) => {
        const item = link.closest('li') || link;
        if (logged) {
            item.remove();
        }
    });

    if (!logged) return;

    const cuentaList = Array.from(document.querySelectorAll('.site-footer .footer-col')).find((col) => {
        const title = col.querySelector('h4')?.textContent || '';
        return /cuenta/i.test(title);
    })?.querySelector('ul');

    if (!cuentaList) return;
    if (!cuentaList.querySelector('a[href*="perfil.html"]')) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${PROFILE_PATH}">Mi perfil</a>`;
        cuentaList.prepend(li);
    }
    if (usuario?.rol === 'admin' && !cuentaList.querySelector('a[href*="admin.html"]')) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${ADMIN_PATH}">Panel admin</a>`;
        cuentaList.prepend(li);
    }
    if (!cuentaList.querySelector('#footer-logout')) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" id="footer-logout">Cerrar sesión</a>`;
        cuentaList.appendChild(li);
        li.querySelector('a')?.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

function ensureStoreNav() {
    const list = document.getElementById('nav-items');
    if (!list) return;

    const home = isInPages ? '../index.html' : 'index.html';
    const products = isInPages ? 'productos.html' : 'pages/productos.html';
    const contact = isInPages ? '../index.html#contact' : '#contact';

    const wanted = [
        {
            key: 'inicio',
            href: home,
            label: 'Inicio',
            match: (href) => (/index\.html/i.test(href) && !/#/.test(href)) || href === '/' || href === ''
        },
        { key: 'productos', href: products, label: 'Productos', match: (href) => /productos\.html/i.test(href) },
        { key: 'contacto', href: contact, label: 'Contacto', match: (href) => /#contact/i.test(href) }
    ];

    // Quitar Inventario/Usuarios del menú global (van en admin-subnav)
    [...list.querySelectorAll('li')].forEach((li) => {
        const href = (li.querySelector('a')?.getAttribute('href') || '').trim();
        const text = (li.textContent || '').trim().toLowerCase();
        const isHashAdmin = /^#(productos|usuarios)$/i.test(href);
        const isAdminLabel = text === 'inventario' || text === 'usuarios';
        if ((isHashAdmin || isAdminLabel) && !/productos\.html/i.test(href)) li.remove();
    });

    wanted.forEach((item, index) => {
        const exists = [...list.querySelectorAll('a')].some((a) => item.match(a.getAttribute('href') || ''));
        if (exists) return;
        const li = document.createElement('li');
        li.setAttribute(`data-nav-${item.key}`, '1');
        li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
        const before = list.children[index] || null;
        list.insertBefore(li, before);
    });

    const storeLinks = [...list.querySelectorAll('li')].filter((li) => !li.hasAttribute('data-nav-account') && !li.hasAttribute('data-nav-admin'));
    storeLinks.forEach((li) => {
        li.classList.remove('active');
        li.querySelector('a')?.removeAttribute('aria-current');
    });

    if (/productos\.html$/i.test(pageName)) {
        const a = [...list.querySelectorAll('a')].find((el) => /productos\.html/i.test(el.getAttribute('href') || ''));
        if (a) {
            a.setAttribute('aria-current', 'page');
            a.closest('li')?.classList.add('active');
        }
    } else if (/^index\.html$/i.test(pageName) || pageName === '' || pageName === '/') {
        const a = [...list.querySelectorAll('a')].find((el) => {
            const href = el.getAttribute('href') || '';
            return /index\.html/i.test(href) && !/#/.test(href);
        });
        if (a) {
            a.setAttribute('aria-current', 'page');
            a.closest('li')?.classList.add('active');
        }
    }
}

function setupNavAccountLink() {
    ensureStoreNav();
    const list = document.getElementById('nav-items');
    if (!list) return;

    if (!list.querySelector('[data-nav-account]')) {
        const li = document.createElement('li');
        li.setAttribute('data-nav-account', '1');

        if (isLoggedIn()) {
            const onProfile = isProfilePage();
            li.innerHTML = `<a href="${PROFILE_PATH}"${onProfile ? ' aria-current="page"' : ''}>Mi perfil</a>`;
            if (onProfile) li.className = 'active';
            list.appendChild(li);
        } else if (!['login.html', 'registro.html', 'recuperar.html', 'reset-password.html'].includes(pageName)) {
            li.innerHTML = `<a href="${LOGIN_PATH}">Entrar</a>`;
            list.appendChild(li);
        }
    }

    const usuario = getUsuario();
    if (isLoggedIn() && usuario?.rol === 'admin' && !list.querySelector('[data-nav-admin]')) {
        const liAdmin = document.createElement('li');
        liAdmin.setAttribute('data-nav-admin', '1');
        const onAdmin = pageName === 'admin.html';
        liAdmin.innerHTML = `<a href="${ADMIN_PATH}"${onAdmin ? ' aria-current="page"' : ''}>Admin</a>`;
        if (onAdmin) liAdmin.className = 'active';
        list.appendChild(liAdmin);
    }
}

function setupUserDropdown() {
    setupFooterAuthLinks();
    setupNavAccountLink();

    const dropdown = document.getElementById('userDropdown');
    const menuBtn = document.getElementById('userMenuBtn');
    if (!dropdown || !menuBtn) return;

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => dropdown.classList.remove('show'));

    const cartPath = isInPages ? 'carrito.html' : 'pages/carrito.html';
    const cartLink = `<a href="${cartPath}" class="dropdown-item"><i class="fas fa-shopping-bag"></i> Mi carrito</a>`;
    const usuario = getUsuario();

    if (usuario && getToken()) {
        const adminLink = usuario.rol === 'admin'
            ? `<a href="${ADMIN_PATH}" class="dropdown-item"><i class="fas fa-user-shield"></i> Panel Admin</a>`
            : '';

        dropdown.innerHTML = `
            <a href="${PROFILE_PATH}" class="dropdown-item"><i class="fas fa-id-card"></i> Mi perfil</a>
            ${cartLink}
            ${adminLink}
            <a href="#" class="dropdown-item" id="logout-link">
                <i class="fas fa-sign-out-alt"></i>
                Cerrar sesión
            </a>
        `;

        document.getElementById('logout-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
        return;
    }

    dropdown.innerHTML = `
        <a href="${LOGIN_PATH}" class="dropdown-item"><i class="fas fa-sign-in-alt"></i> Iniciar sesión</a>
        <a href="${isInPages ? 'registro.html' : 'pages/registro.html'}" class="dropdown-item"><i class="fas fa-user-plus"></i> Registrarse</a>
        ${cartLink}
    `;
}

async function finishLoginSuccess(result, viaGoogle = false) {
    saveSession(result.token, result.usuario);

    const completarPerfil = viaGoogle && (result.esNuevo || result.perfilIncompleto);
    if (completarPerfil) {
        sessionStorage.setItem('yogur_complete_profile', '1');
        showMessage('Cuenta lista. Completa tus datos', 'success');
        window.location.href = PROFILE_PATH;
        return;
    }

    showMessage(viaGoogle ? 'Sesión iniciada con Google' : 'Sesión iniciada', 'success');
    window.location.href = result.usuario.rol === 'admin' ? ADMIN_PATH : HOME_PATH;
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
            showMessage(result.message || 'Credenciales incorrectas o cuenta restringida.', 'error');
            return;
        }

        await finishLoginSuccess(result, false);
    });
}

function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre')?.value.trim();
        const apellido = document.getElementById('apellido')?.value.trim();
        const telefono = document.getElementById('telefono')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const confirm = document.getElementById('confirm-password')?.value
            || document.getElementById('confirm-password')?.value;
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

        if ((password || '').length < 8) {
            showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registrando...';
        }

        const result = await register({ nombre, apellido, telefono, email, password });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Cuenta';
        }

        if (!result.success) {
            showMessage(result.message || 'Error en el registro', 'error');
            return;
        }

        if (result.token && result.usuario) {
            await finishLoginSuccess(result, false);
            return;
        }

        showMessage('Registro exitoso. Ahora puedes iniciar sesión', 'success');
        window.location.href = LOGIN_PATH;
    });
}

function setupRecoverForm() {
    const form = document.getElementById('recoverForm');
    if (!form) return;

    let step = 1;
    const emailInput = document.getElementById('email');
    const codeInput = document.getElementById('codigo');
    const pass1 = document.getElementById('new-pass');
    const pass2 = document.getElementById('new-pass-2');
    const submitBtn = document.getElementById('recoverSubmit');

    const showStep = (n) => {
        step = n;
        form.querySelectorAll('.recover-step').forEach((el) => {
            el.hidden = Number(el.dataset.step) !== n;
        });
        if (submitBtn) {
            submitBtn.textContent = n === 1 ? 'Enviar código' : n === 2 ? 'Continuar' : 'Guardar contraseña';
        }
        if (n === 2) codeInput?.focus();
        if (n === 3) pass1?.focus();
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput?.value.trim();

        if (step === 1) {
            if (!email) {
                showMessage('Ingresa tu correo', 'error');
                return;
            }
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }
            const result = await requestPasswordReset(email);
            if (submitBtn) submitBtn.disabled = false;
            if (!result.success) {
                showMessage(result.message || 'No se pudo enviar el código', 'error');
                showStep(1);
                return;
            }
            await askAlert({
                title: 'Revisa tu correo',
                message: result.message,
                type: 'success'
            });
            showStep(2);
            return;
        }

        if (step === 2) {
            const code = codeInput?.value.trim();
            if (!code || code.length < 6) {
                showMessage('Escribe el código de 6 dígitos', 'error');
                return;
            }
            showStep(3);
            return;
        }

        const password = pass1?.value || '';
        const confirm = pass2?.value || '';
        const codigo = codeInput?.value.trim();
        if (password.length < 8) {
            showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        if (password !== confirm) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }
        const result = await resetPassword({ email, codigo, password });
        if (submitBtn) submitBtn.disabled = false;
        if (!result.success) {
            showMessage(result.message || 'Código inválido o vencido', 'error');
            showStep(2);
            return;
        }
        await askAlert({
            title: 'Contraseña lista',
            message: 'Ya puedes entrar con tu nueva clave. Te enviamos un correo de confirmación.',
            type: 'success'
        });
        window.location.href = LOGIN_PATH;
    });
}

function setupResetForm() {
    const form = document.getElementById('resetForm');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    const tokenInput = document.getElementById('reset-token');
    if (tokenInput) tokenInput.value = token;

    if (!token) {
        askAlert({
            title: 'Enlace inválido',
            message: 'Falta el token. Solicita un enlace nuevo desde recuperar contraseña.',
            type: 'warning'
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password')?.value;
        const confirm = document.getElementById('confirm-password')?.value;
        const submitBtn = form.querySelector('[type="submit"]');

        if (!token) {
            showMessage('Falta el token de recuperación', 'error');
            return;
        }
        if (!password || password.length < 8) {
            showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        if (password !== confirm) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
        }

        const ok = await askConfirm({
            title: 'Guardar nueva contraseña',
            message: '¿Confirmas cambiar tu contraseña ahora?',
            confirmText: 'Sí, guardar',
            cancelText: 'Cancelar',
            type: 'warning'
        });
        if (!ok) return;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }

        const result = await resetPassword({ token, password });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar contraseña';
        }

        if (!result.success) {
            await askAlert({
                title: 'No se pudo actualizar',
                message: result.message || 'El enlace pudo haber expirado.',
                type: 'danger'
            });
            return;
        }

        await askAlert({
            title: 'Contraseña actualizada',
            message: 'Ya puedes iniciar sesión con tu nueva clave.',
            type: 'success'
        });
        window.location.href = LOGIN_PATH;
    });
}

function setupProfileTabs() {
    const tabs = [...document.querySelectorAll('.profile-tab')];
    const panes = [...document.querySelectorAll('.profile-pane')];
    if (!tabs.length || !panes.length) return;

    const activate = (id) => {
        if (!id) return;
        tabs.forEach((tab) => {
            const on = tab.dataset.tab === id;
            tab.classList.toggle('is-active', on);
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panes.forEach((pane) => {
            const on = pane.id === `tab-${id}`;
            pane.classList.toggle('is-active', on);
            if (on) pane.removeAttribute('hidden');
            else pane.setAttribute('hidden', 'hidden');
        });
    };

    tabs.forEach((tab) => {
        tab.setAttribute('type', 'button');
        tab.setAttribute('role', 'tab');
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            activate(tab.dataset.tab);
        });
    });

    const initial = tabs.find((t) => t.classList.contains('is-active'))?.dataset.tab
        || tabs[0]?.dataset.tab;
    if (initial) activate(initial);
}

async function setupProfilePage() {
    if (!isProfilePage()) return;

    // Tabs siempre, aunque falle la carga de datos
    setupProfileTabs();

    const token = getToken();
    if (!token) return;

    let currentUser = normalizeUser(getUsuario());

    try {
        const profileRes = await getProfile(token);
        const loaded = normalizeUser(profileRes.usuario || profileRes.user);
        if (profileRes.success && loaded) {
            currentUser = loaded;
            localStorage.setItem('usuario', JSON.stringify(currentUser));
        } else if (!currentUser) {
            showMessage(profileRes.message || 'No se pudo cargar el perfil', 'error');
            return;
        } else if (!profileRes.success) {
            showMessage(profileRes.message || 'Mostrando datos guardados en este dispositivo', 'warning');
        }
    } catch (err) {
        if (!currentUser) {
            showMessage('No se pudo cargar el perfil', 'error');
            return;
        }
        showMessage('Sin conexión al servidor. Mostrando datos locales.', 'warning');
    }

    if (!currentUser) {
        showMessage('No hay datos de perfil', 'error');
        return;
    }

    paintProfileView(currentUser);
    fillProfileForm(currentUser);
    renderProfileOrders(currentUser);

    const emailHint = document.getElementById('security-email-hint');
    if (emailHint) emailHint.textContent = currentUser.email || 'tu correo';

    if (sessionStorage.getItem('yogur_complete_profile') === '1') {
        sessionStorage.removeItem('yogur_complete_profile');
        document.querySelector('.profile-tab[data-tab="datos"]')?.click();
        showMessage('Completa tu teléfono y apellido', 'info');
        document.getElementById('perfil-telefono')?.focus();
    }

    const nombre = document.getElementById('perfil-nombre');
    const apellido = document.getElementById('perfil-apellido');
    const telefono = document.getElementById('perfil-telefono');

    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }
        const result = await updateProfile({
            nombre: nombre?.value.trim(),
            apellido: apellido?.value.trim(),
            telefono: telefono?.value.trim()
        }, token);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar cambios';
        }
        if (!result.success) {
            showMessage(result.message || 'No se pudo actualizar', 'error');
            return;
        }
        currentUser = normalizeUser(result.usuario) || result.usuario;
        paintProfileView(currentUser);
        fillProfileForm(currentUser);
        localStorage.setItem('usuario', JSON.stringify(currentUser));
        showMessage('Perfil actualizado', 'success');
    });

    document.getElementById('btn-enviar-codigo')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-enviar-codigo');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Enviando...';
        }
        const result = await requestPasswordChangeCode(token);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-envelope"></i> Enviar código al correo';
        }
        if (!result.success) {
            showMessage(result.message || 'No se pudo enviar el código', 'error');
            return;
        }
        showMessage(result.message, 'success');
        document.getElementById('password-codigo')?.focus();
    });

    document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const codigo = document.getElementById('password-codigo')?.value.trim();
        const nueva = document.getElementById('password-nueva')?.value;
        const confirm = document.getElementById('password-confirm')?.value;
        if (!codigo || codigo.length < 6) {
            showMessage('Ingresa el código de 6 dígitos del correo', 'error');
            return;
        }
        if (!nueva || nueva.length < 8) {
            showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        if (nueva !== confirm) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
        }
        const submitBtn = e.target.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Cambiando...';
        }
        const result = await changePassword(null, nueva, token, codigo);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cambiar contraseña';
        }
        if (!result.success) {
            showMessage(result.message || 'No se pudo cambiar la contraseña', 'error');
            return;
        }
        e.target.reset();
        showMessage('Contraseña actualizada. Revisa tu correo de confirmación.', 'success');
    });

    document.getElementById('passwordLegacyForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const actual = document.getElementById('password-actual')?.value;
        const nueva = document.getElementById('password-nueva-legacy')?.value;
        if (!actual || !nueva || nueva.length < 8) {
            showMessage('Completa contraseña actual y nueva (mín. 8 caracteres)', 'error');
            return;
        }
        const result = await changePassword(actual, nueva, token);
        if (!result.success) {
            showMessage(result.message || 'No se pudo cambiar', 'error');
            return;
        }
        e.target.reset();
        showMessage('Contraseña actualizada', 'success');
    });
}

function paintProfileHero(u) {
    const name = [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || 'Mi cuenta';
    const heroName = document.getElementById('profile-hero-name');
    const heroEmail = document.getElementById('profile-hero-email');
    const badge = document.getElementById('profile-provider-badge');
    if (heroName) heroName.textContent = name;
    if (heroEmail) heroEmail.textContent = u.email || '—';
    if (badge) {
        const prov = u.auth_provider || 'local';
        const isGoogle = /google/i.test(prov);
        badge.textContent = isGoogle ? 'Google' : 'Email';
        badge.classList.toggle('is-google', isGoogle);
    }
}

function paintProfileView(u) {
    paintProfileHero(u);
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '—';
    };
    setText('view-nombre', u.nombre);
    setText('view-apellido', u.apellido);
    setText('view-email', u.email);
    setText('view-telefono', u.telefono);
    setText('view-rol', u.rol);

    const adminCard = document.getElementById('profile-admin-card');
    const adminLink = document.getElementById('profile-admin-link');
    const isAdmin = String(u.rol || '').toLowerCase() === 'admin';
    if (adminCard) {
        if (isAdmin) adminCard.removeAttribute('hidden');
        else adminCard.setAttribute('hidden', 'hidden');
    }
    if (adminLink) adminLink.href = ADMIN_PATH;

    // Asegurar link Admin en el menú tras cargar el perfil
    if (isAdmin) setupNavAccountLink();
}

function fillProfileForm(u) {
    const nombre = document.getElementById('perfil-nombre');
    const apellido = document.getElementById('perfil-apellido');
    const email = document.getElementById('perfil-email');
    const telefono = document.getElementById('perfil-telefono');
    if (nombre) nombre.value = u.nombre || '';
    if (apellido) apellido.value = u.apellido || '';
    if (email) email.value = u.email || '';
    if (telefono) telefono.value = u.telefono || '';
}

function renderProfileOrders(usuario) {
    const box = document.getElementById('profile-orders-list');
    if (!box) return;
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('yogur_order_history') || '[]'); } catch { orders = []; }
    if (!Array.isArray(orders)) orders = [];
    const mine = orders.filter((o) => {
        if (usuario?.id && o.userId) return String(o.userId) === String(usuario.id);
        if (usuario?.email && o.email) return o.email === usuario.email;
        return !o.userId && !o.email;
    });
    if (!mine.length) {
        box.innerHTML = '<p class="profile-orders-empty">Aún no hay compras en este dispositivo.</p>';
        return;
    }
    const money = (n) => window.YogurUtils?.formatCOP ? window.YogurUtils.formatCOP(n) : `$${Number(n || 0).toLocaleString('es-CO')}`;
    box.innerHTML = mine.map((order) => {
        const when = order.createdAt
            ? new Date(order.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
            : '';
        const lines = (order.items || []).map((item) =>
            `<li>${item.cantidad} × ${item.nombre}${item.tamano ? ` · ${item.tamano}` : ''}</li>`
        ).join('');
        return `<article class="profile-order">
            <div class="profile-order-head">
                <div><strong>${order.id || 'Pedido'}</strong><div>${when}</div></div>
                <strong>${money(order.total)}</strong>
            </div>
            <ul>${lines}</ul>
        </article>`;
    }).join('');
}

function normalizeUser(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {
        id: raw.id,
        nombre: raw.nombre || '',
        apellido: raw.apellido || '',
        email: raw.email || '',
        telefono: raw.telefono || '',
        rol: raw.rol || 'cliente',
        auth_provider: raw.auth_provider || raw.auth_provider || ''
    };
}

async function handleGoogleCredential(response) {
    if (!response?.credential) {
        showMessage('No se recibió credencial de Google', 'error');
        return;
    }

    const result = await loginWithGoogle(response.credential);
    if (!result.success) {
        showMessage(result.message || 'No se pudo iniciar sesión con Google.', 'error');
        return;
    }

    await finishLoginSuccess(result, true);
}

function setupGoogleSignIn() {
    const clientId = window.YOGUR_CONFIG?.GOOGLE_CLIENT_ID;
    const btn = document.getElementById('googleSignInBtn');
    const mount = document.getElementById('googleBtnMount');
    if (!btn && !mount) return;

    if (!clientId) {
        if (btn) {
            btn.hidden = false;
            btn.title = 'Configura GOOGLE_CLIENT_ID en config.js y backend/.env';
            btn.addEventListener('click', () => {
                askAlert({
                    title: 'Google no configurado',
                    message: 'Agrega tu GOOGLE_CLIENT_ID en frontend/js/config.js y en backend/.env. Guía en docs/GMAIL_Y_GOOGLE.md',
                    type: 'warning'
                });
            });
        }
        return;
    }

    const start = () => {
        if (!window.google?.accounts?.id) return false;
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        if (mount) {
            window.google.accounts.id.renderButton(mount, {
                theme: 'outline',
                size: 'medium',
                shape: 'rectangular',
                text: 'continue_with',
            width: 280
            });
            if (btn) btn.hidden = true;
        }
        return true;
    };

    if (!start()) {
        let tries = 0;
        const timer = setInterval(() => {
            tries += 1;
            if (start() || tries > 40) clearInterval(timer);
        }, 150);
    }

    btn?.addEventListener('click', () => {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    protectAdminPage();
    protectProfilePage();
    redirectIfAuthenticatedOnAuthPages();
    setupUserDropdown();
    setupLoginForm();
    setupRegisterForm();
    setupRecoverForm();
    setupResetForm();
    setupProfilePage();
    setupGoogleSignIn();

    document.getElementById('btn-logout')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
});
