/**
 * auth-menu.js — Menú, botón de cuenta y enlaces del pie según haya sesión o no.
 */
import {
    isInPages, pageName, isLoggedIn, getUsuario, getToken, logout, isProfilePage,
    PROFILE_PATH, ADMIN_PATH, REGISTER_PATH, LOGIN_PATH
} from './auth-comun.js';

function setupFooterAuthLinks() {
    const logged = isLoggedIn();
    const usuario = getUsuario();

    document.querySelectorAll('.site-footer a[href*="login.html"], .site-footer a[href*="registro.html"], [data-ysf] a[href*="login.html"], [data-ysf] a[href*="registro.html"]').forEach((link) => {
        const item = link.closest('li') || link;
        if (logged) {
            item.remove();
        }
    });

    if (!logged) return;

    const cuentaList = document.querySelector('[data-ysf-account]') || Array.from(document.querySelectorAll('.site-footer .footer-col')).find((col) => {
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

    const home = isInPages ? '../index.html' : '';
    const products = isInPages ? 'productos.html' : 'pages/productos.html';

    // Menú de la marca: Sabores, Nosotros, Distribuidores y Contacto (el logo lleva al inicio)
    const wanted = [
        { key: 'sabores', href: products, label: 'Sabores', match: (href) => /productos\.html/i.test(href) },
        { key: 'nosotros', href: `${home}#nosotros`, label: 'Nosotros', match: (href) => /#nosotros/i.test(href) },
        { key: 'distribuidores', href: `${home}#distribuidores`, label: 'Distribuidores', match: (href) => /#distribuidores/i.test(href) },
        { key: 'contacto', href: `${home}#contact`, label: 'Contacto', match: (href) => /#contact/i.test(href) }
    ];

    // En el panel, Inventario y Usuarios van en la subbarra, no en el menú de la tienda.
    // #productos en el inicio es la sección de sabores: no se borra.
    [...list.querySelectorAll('li')].forEach((li) => {
        const href = (li.querySelector('a')?.getAttribute('href') || '').trim();
        const text = (li.textContent || '').trim().toLowerCase();
        const isHashAdmin = pageName === 'admin.html' && /^#(productos|usuarios)$/i.test(href);
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
            li.innerHTML = `<a href="${REGISTER_PATH}">Regístrate</a>`;
            list.appendChild(li);
        }
    }

    // Escritorio: si no hay sesión activa muestra "Regístrate", si hay sesión muestra el ícono de perfil
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn) {
        list.querySelector('[data-nav-account]')?.classList.add('nav-account--mobile');
        if (isLoggedIn()) {
            accountBtn.className = 'icon-btn icon-btn--account';
            accountBtn.setAttribute('href', PROFILE_PATH);
            accountBtn.setAttribute('aria-label', 'Mi perfil');
            accountBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`;
            if (isProfilePage()) accountBtn.setAttribute('aria-current', 'page');
        } else {
            accountBtn.className = 'btn-header-register';
            accountBtn.setAttribute('href', REGISTER_PATH);
            accountBtn.setAttribute('aria-label', 'Regístrate');
            accountBtn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg><span>Regístrate</span>`;
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

export function setupUserDropdown() {
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
