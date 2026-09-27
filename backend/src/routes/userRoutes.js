/**
 * userRoutes.js — Rutas admin de usuarios
 * GET /api/users  |  PATCH /api/users/:id/activo
 */
const express = require('express');
const router = express.Router();
const { listUsers, toggleUserActive } = require('../controllers/userController');
const { verificarToken, verificarAdmin } = require('../middleware/verifyToken');

router.get('/', verificarToken, verificarAdmin, listUsers);
router.patch('/:id/activo', verificarToken, verificarAdmin, toggleUserActive);

module.exports = router;
