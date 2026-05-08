const express = require('express');
const router = express.Router();
const { login, registro, perfil } = require('../controllers/authController');
const { verificarToken } = require('../middleware/verifyToken');

router.post('/login', login);
router.post('/registro', registro);
router.get('/perfil', verificarToken, perfil);

module.exports = router;
