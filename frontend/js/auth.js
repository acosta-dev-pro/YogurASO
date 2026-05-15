/**
 * auth.js — Aquí quedan los formularios: entrar, registrarse, recuperar la clave y el perfil.
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
    loginWithGoogle,
    loginWithGoogleRedirect,
    verifySignupCode,
    resendSignupCode,
    syncSession,
    deleteMyAccount
} from './api.js';
import {
    HOME_PATH, ADMIN_PATH, LOGIN_PATH, PROFILE_PATH, pageName,
    cleanCode, isCode, relaxCodeInputs, isProfilePage, showMessage, askConfirm, askAlert,
    getUsuario, getToken, saveSession, logout,
    redirectIfAuthenticatedOnAuthPages, protectAdminPage, protectProfilePage
} from './auth-comun.js';
import { setupUserDropdown, setupNavAccountLink } from './auth-menu.js';

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
            submitBtn.textContent = loginForm.classList.contains('ya-form') ? 'Entrar' : 'Iniciar Sesión';
        }

        if (!result.success) {
            if (result.code === 'email_not_confirmed') {
                const resend = await resendSignupCode(email);
                showSignupCodeStep(loginForm, email, resend.success
                    ? `Tu correo aún no está confirmado. ${resend.message} Escríbelo aquí.`
                    : 'Tu correo aún no está confirmado. Escribe el código que te enviamos.');
                if (!resend.success) showMessage(resend.message, 'warning');
                return;
            }
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
            submitBtn.textContent = registerForm.classList.contains('ya-form') ? 'Crear cuenta' : 'Crear Cuenta';
        }

        if (!result.success) {
            showMessage(result.message || 'Error en el registro', 'error');
            return;
        }

        if (result.token && result.usuario) {
            await finishLoginSuccess(result, false);
            return;
        }

        if (result.needsConfirmation) {
            showSignupCodeStep(registerForm, email, `${result.message} Escríbelo aquí para activar tu cuenta.`);
            return;
        }

        showMessage('Registro exitoso. Ahora puedes iniciar sesión', 'success');
        window.location.href = LOGIN_PATH;
    });
}

/**
 * Paso "confirma tu correo": Supabase manda un código de 6 dígitos
 * (plantilla Confirm signup). Se arma aquí para no tocar el HTML de la página.
 */
function showSignupCodeStep(anchorForm, email, message) {
    let form = document.getElementById('verifyForm');
    if (!form) {
        form = document.createElement('form');
        form.className = anchorForm.className || 'ya-form';
        form.id = 'verifyForm';
        form.noValidate = true;
        form.innerHTML = `
            <p class="ya-lead" id="verify-msg" aria-live="polite"></p>
            <div class="ya-field">
                <label class="ya-label" for="signup-code">Código del correo</label>
                <input class="ya-input" type="text" id="signup-code" inputmode="numeric" maxlength="12" placeholder="Código del correo" autocomplete="one-time-code" required>
            </div>
            <button type="submit" class="ya-btn ya-btn--primary">Confirmar cuenta</button>
            <p><button type="button" class="ya-link ya-link--sm" id="verify-resend" style="background:none;border:0;padding:0;cursor:pointer">Reenviar código</button>
            · <a class="ya-link ya-link--sm" href="#" id="verify-back">Usar otro correo</a></p>`;
        anchorForm.insertAdjacentElement('afterend', form);

        const codeInput = form.querySelector('#signup-code');
        const submitBtn = form.querySelector('[type="submit"]');
        const resendBtn = form.querySelector('#verify-resend');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = cleanCode(codeInput.value);
            if (!isCode(code)) {
                showMessage('Escribe el código completo que llegó al correo', 'error');
                codeInput.focus();
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = 'Confirmando...';
            const result = await verifySignupCode(form.dataset.email, code);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirmar cuenta';
            if (!result.success) {
                showMessage(result.message || 'Código inválido o vencido', 'error');
                return;
            }
            showMessage('¡Cuenta confirmada!', 'success');
            await finishLoginSuccess(result, false);
        });

        resendBtn.addEventListener('click', async () => {
            resendBtn.disabled = true;
            const res = await resendSignupCode(form.dataset.email);
            showMessage(res.message || (res.success ? 'Código enviado' : 'No se pudo reenviar'), res.success ? 'success' : 'error');
            setTimeout(() => { resendBtn.disabled = false; }, 60000);
        });

        form.querySelector('#verify-back').addEventListener('click', (e) => {
            e.preventDefault();
            form.hidden = true;
            anchorForm.hidden = false;
        });
    }
    form.dataset.email = email;
    form.querySelector('#verify-msg').textContent = message || `Te enviamos un código a ${email}.`;
    form.hidden = false;
    anchorForm.hidden = true;
    form.querySelector('#signup-code').value = '';
    form.querySelector('#signup-code').focus();
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
            const code = cleanCode(codeInput?.value);
            if (!isCode(code)) {
                showMessage('Escribe el código completo que llegó al correo', 'error');
                return;
            }
            showStep(3);
            return;
        }

        const password = pass1?.value || '';
        const confirm = pass2?.value || '';
        const codigo = cleanCode(codeInput?.value);
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
            message: 'Ya puedes entrar con tu nueva clave.',
            type: 'success'
        });
        window.location.href = LOGIN_PATH;
    });
}

function setupResetForm() {
    const form = document.getElementById('resetForm');
    if (!form) return;

    // Con Supabase la recuperación va por código (recuperar.html). Esta página
    // solo sirve si se llega con una sesión de recuperación (enlace del correo).
    let token = '';
    const ready = syncSession().then(({ session }) => {
        token = session?.access_token || '';
        const tokenInput = document.getElementById('reset-token');
        if (tokenInput) tokenInput.value = token ? '1' : '';
        if (!token) {
            askAlert({
                title: 'Usa el código del correo',
                message: 'Para cambiar tu contraseña pide un código en "Recuperar contraseña".',
                type: 'warning'
            }).then(() => { window.location.href = 'recuperar.html'; });
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password')?.value;
        const confirm = document.getElementById('confirm-password')?.value;
        const submitBtn = form.querySelector('[type="submit"]');

        await ready;
        if (!token) {
            showMessage('Pide un código nuevo en "Recuperar contraseña"', 'error');
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

        const result = await resetPassword({ password });

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
        } else if (profileRes.status === 401) {
            window.location.href = LOGIN_PATH;
            return;
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

    document.getElementById('btn-eliminar-cuenta')?.addEventListener('click', async () => {
        const ok = await window.YogurUtils?.confirmAction?.({
            title: 'Eliminar mi cuenta',
            message: 'Se borra tu cuenta y tu perfil. No se puede deshacer. ¿Seguro?',
            confirmText: 'Sí, eliminar',
            danger: true
        });
        if (!ok) return;
        const btn = document.getElementById('btn-eliminar-cuenta');
        if (btn) { btn.disabled = true; btn.textContent = 'Eliminando...'; }
        const result = await deleteMyAccount();
        if (!result.success) {
            if (btn) { btn.disabled = false; btn.textContent = 'Eliminar mi cuenta'; }
            showMessage(result.message || 'No se pudo eliminar la cuenta', 'error');
            return;
        }
        showMessage('Tu cuenta fue eliminada', 'success');
        logout();
    });

    document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const codigo = cleanCode(document.getElementById('password-codigo')?.value);
        const nueva = document.getElementById('password-nueva')?.value;
        const confirm = document.getElementById('password-confirm')?.value;
        if (!isCode(codigo)) {
            showMessage('Ingresa el código completo que llegó al correo', 'error');
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
        showMessage('Contraseña actualizada.', 'success');
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
        activo: raw.activo !== false,
        auth_provider: raw.auth_provider || raw.auth_provider || ''
    };
}

// Nonce de Google: a Google va el SHA-256 en hex y a Supabase el valor sin cifrar.
let googleRawNonce = null;
async function makeGoogleNonce() {
    try {
        if (!window.crypto?.subtle) return null;
        const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
        const hashed = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
        return { raw, hashed };
    } catch {
        return null;
    }
}

async function handleGoogleCredential(response) {
    if (!response?.credential) {
        showMessage('No se recibió credencial de Google', 'error');
        return;
    }

    const result = await loginWithGoogle(response.credential, googleRawNonce);
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
            btn.title = 'Configura GOOGLE_CLIENT_ID en config.js';
            btn.addEventListener('click', () => {
                askAlert({
                    title: 'Google no configurado',
                    message: 'Agrega tu GOOGLE_CLIENT_ID en frontend/js/config.js (el mismo de Supabase → Providers → Google).',
                    type: 'warning'
                });
            });
        }
        return;
    }

    // El botón oficial de Google solo acepta páginas https (o localhost). Si la web se abre en http
    // (por ejemplo, mientras el dominio propio no tiene certificado), se usa el ingreso por redirección
    // de Supabase, que no depende del origen de la página.
    const origenSeguro = location.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    if (!origenSeguro) {
        if (btn) {
            btn.hidden = false;
            btn.addEventListener('click', async () => {
                const res = await loginWithGoogleRedirect();
                if (!res.success) showMessage(res.message || 'No se pudo abrir Google', 'error');
            });
        }
        return;
    }

    let nonce;
    const noncePromise = makeGoogleNonce().then((n) => { nonce = n; });

    const start = () => {
        if (!window.google?.accounts?.id || nonce === undefined) return false;
        googleRawNonce = nonce?.raw || null;
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
            ...(nonce?.hashed ? { nonce: nonce.hashed } : {})
        });
        if (mount) {
            // Ancho del botón oficial = ancho de la tarjeta (GSI acepta 200–400 px)
            const mountWidth = Math.round(mount.offsetWidth || mount.getBoundingClientRect().width || 280);
            const compact = mount.closest('.ya-google');
            window.google.accounts.id.renderButton(mount, {
                theme: 'outline',
                size: compact ? 'large' : 'medium',
                shape: compact ? 'pill' : 'rectangular',
                text: 'continue_with',
                logo_alignment: 'center',
                locale: 'es',
                width: Math.max(200, Math.min(400, compact ? mountWidth : 280))
            });
            if (btn) btn.hidden = true;
        }
        return true;
    };

    noncePromise.then(() => {
        if (start()) return;
        let tries = 0;
        const timer = setInterval(() => {
            tries += 1;
            if (start()) {
                clearInterval(timer);
            } else if (tries > 40) {
                clearInterval(timer);
                // El botón oficial no cargó: queda el botón propio con redirección de Supabase.
                if (btn) btn.hidden = false;
            }
        }, 150);
    });

    btn?.addEventListener('click', async () => {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
            return;
        }
        const res = await loginWithGoogleRedirect();
        if (!res.success) showMessage(res.message || 'No se pudo abrir Google', 'error');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    relaxCodeInputs();
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
