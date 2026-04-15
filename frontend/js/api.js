/**
 * Capa de datos. Reexporta los módulos de js/api/.
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
    changePassword,
    deleteMyAccount
} from './api/cuentas.js';
export { fetchUsers, toggleUserActive } from './api/usuarios.js';
export { createOrder } from './api/pedidos.js';
export { getSetting, saveSetting, uploadSiteMedia } from './api/ajustes.js';
