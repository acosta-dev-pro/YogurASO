const express = require('express');
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middleware/verifyToken');
const db = require('../config/db');
router.get('/', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT id, nombre, email, rol, fecha_registro FROM usuarios ORDER BY id');
        res.json({ success: true, users: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
});
module.exports = router;
