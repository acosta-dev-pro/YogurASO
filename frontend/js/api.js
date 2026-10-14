/**
 * api.js — Capa de datos. Cada tema está en js/api/. Este archivo solo reexporta.
 *
 * Este archivo solo reexporta. Cada tema vive en su propio módulo:
 *   api/cliente.js    conexión y errores en español
 *   api/mapeo.js      columnas de la base ↔ campos de la interfaz
 *   api/sesion.js     sesión y espejo en localStorage
 *   api/productos.js  catálogo y fotos
 *   api/cuentas.js    registro, ingreso y contraseñas
 *   api/usuarios.js   cuentas del panel
 *   api/pedidos.js    guardar el pedido antes de WhatsApp
 *
 * auth.js, main.js, admin.js y el carrito siguen importando './api.js'.
 * La clave pública está en supabase-client.js. Nunca va aquí la Secret key.
 */
export { syncSession, verifyAdmin, logout, checkHealth } from './api/sesion.js';
export {
    fetchProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    permanentlyDeleteProduct,
    uploadImage
} from './api/productos.js';
export {
    login,
    register,
    verifySignupCode,
    resendSignupCode,
    getProfile,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    loginWithGoogle,
    loginWithGoogleRedirect,
    requestPasswordChangeCode,
    changePassword
} from './api/cuentas.js';
export { fetchUsers, toggleUserActive } from './api/usuarios.js';
export { createOrder } from './api/pedidos.js';
