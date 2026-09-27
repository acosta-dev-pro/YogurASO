/**
 * api.js — Cliente HTTP hacia el backend
 * Todas las llamadas al API pasan por aquí (productos, auth, upload, users).
 * La URL base sale de config.js → YOGUR_CONFIG.API_URL
 */
const API_URL = (window.YOGUR_CONFIG && window.YOGUR_CONFIG.API_URL)
    || (window.YOGUR_CONFIG && window.YOGUR_CONFIG.API_URL)
    || 'http://localhost:3000/api';

function clearSessionAndRedirect(message) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    if (window.YogurUtils?.showToast) {
        window.YogurUtils.showToast(message || 'Sesión expirada. Inicia sesión de nuevo.', 'error');
    }
    const inPages = window.location.pathname.includes('/pages/');
    setTimeout(() => {
        window.location.href = inPages ? 'login.html' : 'pages/login.html';
    }, 600);
}

async function request(path, options = {}) {
    try {
        const headers = {
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers || {})
        };

        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/registro') || path.startsWith('/auth/recuperar') || path.startsWith('/auth/reset');
            if ((response.status === 401 || response.status === 403) && headers.Authorization && !isAuthRoute) {
                const msg = data.message || '';
                if (/token/i.test(msg) || response.status === 401) {
                    clearSessionAndRedirect(msg || 'Tu sesión expiró');
                }
            }
            return {
                success: false,
                message: data.message || 'Solicitud fallida',
                status: response.status,
                ...data
            };
        }

        return data;
    } catch (error) {
        return { success: false, message: 'Error de conexión con el servidor', error: error.message };
    }
}

export async function checkHealth() {
    return request('/health');
}

export async function fetchProducts(includeInactive = false, token = null) {
    const query = includeInactive ? '?includeInactive=true' : '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const data = await request(`/products${query}`, { headers });
    if (!data.success) {
        console.error('Productos:', data.message);
        const empty = [];
        empty._error = data.message || 'No se pudieron cargar los productos';
        empty._status = data.status;
        return empty;
    }
    return data.products || [];
}

export async function getProduct(id) {
    return request(`/products/${id}`);
}

export async function createProduct(payload, token) {
    return request('/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
}

export async function updateProduct(id, payload, token) {
    return request(`/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
}

export async function deleteProduct(id, token) {
    return request(`/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
}

export async function uploadImage(file, token) {
    const formData = new FormData();
    formData.append('imagen', file);
    return request('/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });
}

export async function login(email, password) {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

export async function register(userData) {
    return request('/auth/registro', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

export async function getProfile(token) {
    return request('/auth/perfil', {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export async function updateProfile(payload, token) {
    return request('/auth/perfil', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
}

export async function requestPasswordReset(email) {
    return request('/auth/recuperar', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}

export async function resetPassword({ email, codigo, token, password }) {
    return request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, codigo, token, password })
    });
}

export async function loginWithGoogle(credential) {
    return request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential })
    });
}

export async function requestPasswordChangeCode(token) {
    return request('/auth/perfil/codigo-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
}

export async function changePassword(passwordActual, passwordNueva, token, codigo = null) {
    const body = codigo
        ? { codigo, passwordNueva }
        : { passwordActual, passwordNueva };
    return request('/auth/cambiar-password', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
    });
}

export async function fetchUsers(token) {
    return request('/users', {
        headers: { Authorization: `Bearer ${token}` }
    });
}

export async function toggleUserActive(id, token) {
    return request(`/users/${id}/activo`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
    });
}
