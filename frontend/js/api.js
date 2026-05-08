const API_URL = 'http://localhost:3000/api';

async function request(path, options = {}) {
    try {
        const response = await fetch(`${API_URL}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
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

export async function fetchProducts(includeInactive = false) {
    const query = includeInactive ? '?includeInactive=true' : '';
    const data = await request(`/products${query}`);
    if (!data.success) return [];
    return data.products || [];
}

export async function getProduct(id) {
    return request(`/products/${id}`);
}

export async function createProduct(payload, token) {
    return request('/products', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
}

export async function updateProduct(id, payload, token) {
    return request(`/products/${id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
}

export async function deleteProduct(id, token) {
    return request(`/products/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
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
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}
