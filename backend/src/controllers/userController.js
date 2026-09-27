/**
 * userController.js — Gestión de usuarios (solo admin)
 */
const db = require('../config/db');

const listUsers = async (req, res) => {
    try {
        // Sin password ni tokens: el admin solo necesita datos de cuenta
        const result = await db.query(
            `SELECT id, nombre, apellido, email, telefono, rol, activo, created_at
             FROM usuarios
             ORDER BY id ASC`
        );
        const users = result.rows.map((row) => ({
            ...row,
            activo: row.activo !== undefined ? Boolean(row.activo) : row.activo !== false
        }));
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ success: false, message: 'Error al listar usuarios' });
    }
};

const toggleUserActive = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        if (req.usuario.id === id) {
            return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta' });
        }

        const current = await db.query('SELECT id, activo FROM usuarios WHERE id = $1', [id]);
        if (!current.rows[0]) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const nuevoEstado = !current.rows[0].activo;
        const result = await db.query(
            `UPDATE usuarios SET activo = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, nombre, apellido, email, telefono, rol, activo, created_at`,
            [nuevoEstado, id]
        );

        res.json({
            success: true,
            message: nuevoEstado ? 'Usuario activado' : 'Usuario desactivado',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
};

module.exports = { listUsers, toggleUserActive };
