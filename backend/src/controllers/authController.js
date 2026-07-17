/**
 * authController.js — Autenticación (backend)
 * login, registro y perfil. Emite JWT con id, email, nombre y rol.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(usuario) {
    return jwt.sign(
        { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
        }

        const result = await db.query(
            'SELECT id, nombre, apellido, email, password, rol, activo FROM usuarios WHERE email = $1',
            [String(email).trim().toLowerCase()]
        );
        const usuario = result.rows[0];
        if (!usuario) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        if (usuario.activo === false) {
            return res.status(403).json({ success: false, message: 'Cuenta desactivada. Contacta al administrador.' });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        const token = signToken(usuario);
        delete usuario.password;
        delete usuario.activo;
        res.json({ success: true, message: 'Login exitoso', token, usuario });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const registro = async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ success: false, message: 'Nombre, email y contraseña requeridos' });
        }

        const emailNormalizado = String(email).trim().toLowerCase();
        if (!EMAIL_REGEX.test(emailNormalizado)) {
            return res.status(400).json({ success: false, message: 'Email inválido' });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [emailNormalizado]);
        if (existe.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'El email ya está registrado' });
        }

        const nombreParts = String(nombre).trim().split(/\s+/);
        const nombreBase = nombreParts.shift() || String(nombre).trim();
        const apellidoBase = nombreParts.join(' ') || 'Cliente';

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const result = await db.query(
            'INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, apellido, email, rol',
            [nombreBase, apellidoBase, emailNormalizado, passwordHash, telefono || null, 'cliente']
        );

        const usuario = result.rows[0];
        const token = signToken(usuario);
        res.status(201).json({ success: true, message: 'Registro exitoso', token, usuario });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const perfil = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, nombre, apellido, email, telefono, rol, created_at FROM usuarios WHERE id = $1 AND activo = true',
            [req.usuario.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        res.json({ success: true, usuario: result.rows[0] });
    } catch (error) {
        console.error('Error en perfil:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

module.exports = { login, registro, perfil };
