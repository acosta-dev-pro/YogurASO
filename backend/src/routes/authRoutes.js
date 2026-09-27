/**
 * authRoutes.js — Rutas de autenticación
 */
const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { verificarToken } = require('../middleware/verifyToken');

router.post('/login', auth.login);
router.post('/registro', auth.registro);
router.post('/google', auth.googleLogin);
router.post('/recuperar', auth.solicitarRecuperacion);
router.post('/reset-password', auth.resetPassword);
router.get('/perfil', verificarToken, auth.perfil);
router.put('/perfil', verificarToken, auth.actualizarPerfil);
router.put('/cambiar-password', verificarToken, auth.cambiarPassword);
router.post('/perfil/codigo-password', verificarToken, auth.solicitarCodigoCambioPassword);
router.get('/profile', verificarToken, auth.perfil);
router.put('/profile', verificarToken, auth.actualizarPerfil);
router.put('/change-password', verificarToken, auth.cambiarPassword);

module.exports = router;
