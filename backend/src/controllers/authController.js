const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
        const result = await db.query('SELECT id, nombre, apellido, email, password, rol FROM usuarios WHERE email = $1', [email]);
        const usuario = result.rows[0];
        if (!usuario) return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        const token = jwt.sign({ id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '8h' });
        delete usuario.password;
        res.json({ success: true, message: 'Login exitoso', token, usuario });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const registro = async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion } = req.body;
        if (!nombre || !email || !password) return res.status(400).json({ success: false, message: 'Nombre, email y contraseña requeridos' });
        const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (existe.rows.length > 0) return res.status(400).json({ success: false, message: 'El email ya está registrado' });

        const nombreParts = nombre.trim().split(/\s+/);
        const nombreBase = nombreParts.shift() || nombre.trim();
        const apellidoBase = nombreParts.join(' ') || 'Cliente';

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const result = await db.query(
            'INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, apellido, email, rol',
            [nombreBase, apellidoBase, email, passwordHash, telefono || null, 'cliente']
        );
        const usuario = result.rows[0];
        const token = jwt.sign({ id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(201).json({ success: true, message: 'Registro exitoso', token, usuario });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const perfil = async (req, res) => {
    try {
        const result = await db.query('SELECT id, nombre, apellido, email, telefono, rol, created_at FROM usuarios WHERE id = $1', [req.usuario.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        res.json({ success: true, usuario: result.rows[0] });
    } catch (error) {
        console.error('Error en perfil:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

module.exports = { login, registro, perfil };
