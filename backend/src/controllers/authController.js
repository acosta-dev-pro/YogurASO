/**
 * authController.js — Autenticación (backend)
 * login, registro, perfil, recuperar/reset password, cambiar password.
 */
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const {
    sendQuiet,
    sendWelcomeEmail,
    sendRecoveryCodeEmail,
    sendPasswordChangeCodeEmail,
    sendPasswordChangedEmail
} = require('../services/mailService');

function hashCode(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const googleClient = process.env.GOOGLE_CLIENT_ID
    ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    : null;

function signToken(usuario) {
    return jwt.sign(
        { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
}

function frontendBaseUrl() {
    return (process.env.FRONTEND_URL || 'http://127.0.0.1:5500').replace(/\/$/, '');
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
        }

        const result = await db.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [String(email).trim().toLowerCase()]
        );
        const usuario = result.rows[0];
        if (!usuario) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        if (usuario.activo === false) {
            return res.status(403).json({ success: false, message: 'Cuenta desactivada. Contacta al administrador.' });
        }

        if (!usuario.password) {
            return res.status(400).json({
                success: false,
                message: 'Esta cuenta usa Google. Inicia sesión con el botón de Google.'
            });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        const token = signToken(usuario);
        delete usuario.password;
        delete usuario.activo;
        sendQuiet(sendWelcomeEmail(usuario.email, usuario.nombre, { firstTime: false }));
        res.json({ success: true, message: 'Login exitoso', token, usuario });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const registro = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ success: false, message: 'Nombre, email y contraseña requeridos' });
        }

        const emailNormalizado = String(email).trim().toLowerCase();
        if (!EMAIL_REGEX.test(emailNormalizado)) {
            return res.status(400).json({ success: false, message: 'Email inválido' });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [emailNormalizado]);
        if (existe.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'El email ya está registrado' });
        }

        const nombreParts = String(nombre).trim().split(/\s+/);
        const nombreBase = nombreParts.shift() || String(nombre).trim();
        const apellidoBase = apellido && String(apellido).trim()
            ? String(apellido).trim()
            : (nombreParts.join(' ') || 'Cliente');
        const telefonoBase = telefono ? String(telefono).trim() : null;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        let result;
        try {
            result = await db.query(
                `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol, auth_provider)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, nombre, apellido, email, telefono, rol, auth_provider`,
                [nombreBase, apellidoBase, emailNormalizado, passwordHash, telefonoBase, 'cliente', 'local']
            );
        } catch (insertErr) {
            result = await db.query(
                `INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, nombre, apellido, email, telefono, rol`,
                [nombreBase, apellidoBase, emailNormalizado, passwordHash, telefonoBase, 'cliente']
            );
        }

        const usuario = result.rows[0];
        const token = signToken(usuario);
        sendQuiet(sendWelcomeEmail(usuario.email, usuario.nombre, { firstTime: true }));
        res.status(201).json({ success: true, message: 'Registro exitoso', token, usuario });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const perfil = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM usuarios WHERE id = $1 AND activo IS DISTINCT FROM false',
            [req.usuario.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        const row = result.rows[0];
        delete row.password;
        res.json({
            success: true,
            usuario: {
                id: row.id,
                nombre: row.nombre || '',
                apellido: row.apellido || '',
                email: row.email || '',
                telefono: row.telefono || '',
                rol: row.rol || 'cliente',
                auth_provider: row.auth_provider || row.auth_provider || ''
            }
        });
    } catch (error) {
        console.error('Error en perfil:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const actualizarPerfil = async (req, res) => {
    try {
        const { nombre, apellido, telefono } = req.body;
        if (!nombre || !String(nombre).trim()) {
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        }

        const result = await db.query(
            `UPDATE usuarios
             SET nombre = $1,
                 apellido = $2,
                 telefono = $3,
                 updated_at = NOW()
             WHERE id = $4 AND activo = true
             RETURNING id, nombre, apellido, email, telefono, rol, created_at`,
            [
                String(nombre).trim(),
                apellido ? String(apellido).trim() : '',
                telefono ? String(telefono).trim() : null,
                req.usuario.id
            ]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, message: 'Perfil actualizado', usuario: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

/** Solicitar recuperación — siempre responde genérico (no revela si el email existe) */
const solicitarRecuperacion = async (req, res) => {
    const mensajeOk = 'Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.';
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ success: false, message: 'Email inválido' });
        }

        const userRes = await db.query(
            'SELECT id, email, activo FROM usuarios WHERE email = $1',
            [email]
        );
        const usuario = userRes.rows[0];

        if (usuario && usuario.activo !== false) {
            // Cuentas solo Google: no tienen password local
            const full = await db.query('SELECT password, auth_provider FROM usuarios WHERE id = $1', [usuario.id]);
            if (full.rows[0] && !full.rows[0].password) {
                return res.json({
                    success: true,
                    message: 'Esta cuenta inicia sesión con Google. Usa el botón "Continuar con Google" en el login.'
                });
            }

            const codigo = String(crypto.randomInt(100000, 999999));
            const expira = new Date(Date.now() + 15 * 60 * 1000);

            await db.query(
                'UPDATE tokens_recuperacion SET usado = true WHERE usuario_id = $1 AND usado = false',
                [usuario.id]
            );
            await db.query(
                `INSERT INTO tokens_recuperacion (usuario_id, token, usado, expira_en)
                 VALUES ($1, $2, false, $3)`,
                [usuario.id, hashCode(codigo), expira]
            );

            const nombreRes = await db.query('SELECT nombre FROM usuarios WHERE id = $1', [usuario.id]);
            try {
                await sendRecoveryCodeEmail(usuario.email, nombreRes.rows[0]?.nombre, codigo);
            } catch (mailErr) {
                console.error(mailErr);
                return res.status(500).json({
                    success: false,
                    message: mailErr.message || 'No se pudo enviar el correo de recuperación'
                });
            }
        }

        res.json({
            success: true,
            message: 'Si el correo está en YogurASO, te enviamos un código de 6 dígitos. Revisa bandeja de entrada y spam. El código dura 15 minutos.'
        });
    } catch (error) {
        console.error('Error en recuperar:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, codigo, email, password } = req.body;
        const code = String(codigo || token || '').trim();
        if (!code || !password) {
            return res.status(400).json({ success: false, message: 'Código y nueva contraseña son requeridos' });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const hashed = hashCode(code);
        let tokRes;

        if (email) {
            const userRes = await db.query(
                'SELECT id FROM usuarios WHERE email = $1',
                [String(email).trim().toLowerCase()]
            );
            const uid = userRes.rows[0]?.id;
            if (!uid) {
                return res.status(400).json({ success: false, message: 'Código inválido o vencido. Pide uno nuevo.' });
            }
            tokRes = await db.query(
                `SELECT id, usuario_id, usado, expira_en
                 FROM tokens_recuperacion
                 WHERE usuario_id = $1 AND token = $2
                 ORDER BY id DESC LIMIT 1`,
                [uid, hashed]
            );
        } else {
            tokRes = await db.query(
                `SELECT id, usuario_id, usado, expira_en
                 FROM tokens_recuperacion
                 WHERE token = $1
                 ORDER BY id DESC LIMIT 1`,
                [hashed]
            );
        }

        const row = tokRes.rows[0];
        if (!row || row.usado || new Date(row.expira_en) < new Date()) {
            return res.status(400).json({ success: false, message: 'Código inválido o vencido. Pide uno nuevo.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(String(password), salt);

        await db.query('UPDATE usuarios SET password = $1, updated_at = NOW() WHERE id = $2', [hash, row.usuario_id]);
        await db.query('UPDATE tokens_recuperacion SET usado = true WHERE id = $1', [row.id]);

        const u = await db.query('SELECT email, nombre FROM usuarios WHERE id = $1', [row.usuario_id]);
        if (u.rows[0]) sendQuiet(sendPasswordChangedEmail(u.rows[0].email, u.rows[0].nombre));

        res.json({ success: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva, codigo } = req.body;
        if (!passwordNueva) {
            return res.status(400).json({ success: false, message: 'La nueva contraseña es requerida' });
        }
        if (String(passwordNueva).length < 8) {
            return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres' });
        }

        const userRes = await db.query(
            'SELECT id, email, nombre, password, auth_provider FROM usuarios WHERE id = $1 AND activo = true',
            [req.usuario.id]
        );
        const usuario = userRes.rows[0];
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const viaCodigo = Boolean(codigo && String(codigo).trim());

        if (viaCodigo) {
            const hashed = hashCode(String(codigo).trim());
            const tokRes = await db.query(
                `SELECT id, usado, expira_en FROM tokens_recuperacion
                 WHERE usuario_id = $1 AND token = $2 ORDER BY id DESC LIMIT 1`,
                [usuario.id, hashed]
            );
            const row = tokRes.rows[0];
            if (!row || row.usado || new Date(row.expira_en) < new Date()) {
                return res.status(400).json({ success: false, message: 'Código inválido o vencido. Solicita uno nuevo.' });
            }
            await db.query('UPDATE tokens_recuperacion SET usado = true WHERE id = $1', [row.id]);
        } else {
            if (!passwordActual) {
                return res.status(400).json({ success: false, message: 'Ingresa tu contraseña actual o usa el código enviado al correo' });
            }
            if (!usuario.password) {
                return res.status(400).json({
                    success: false,
                    message: 'Tu cuenta es de Google. Solicita un código al correo para crear o cambiar contraseña.'
                });
            }
            const ok = await bcrypt.compare(String(passwordActual), usuario.password);
            if (!ok) {
                return res.status(401).json({ success: false, message: 'La contraseña actual no es correcta' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(String(passwordNueva), salt);
        await db.query(
            `UPDATE usuarios SET password = $1,
             auth_provider = CASE WHEN auth_provider = 'google' THEN 'local+google' ELSE COALESCE(auth_provider, 'local') END,
             updated_at = NOW() WHERE id = $2`,
            [hash, usuario.id]
        );

        sendQuiet(sendPasswordChangedEmail(usuario.email, usuario.nombre));
        res.json({ success: true, message: 'Contraseña cambiada correctamente' });
    } catch (error) {
        console.error('Error en cambiar-password:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

/** Código al correo registrado (usuario autenticado en perfil) */
const solicitarCodigoCambioPassword = async (req, res) => {
    try {
        const userRes = await db.query(
            'SELECT id, email, nombre, activo FROM usuarios WHERE id = $1',
            [req.usuario.id]
        );
        const usuario = userRes.rows[0];
        if (!usuario || usuario.activo === false) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const codigo = String(crypto.randomInt(100000, 999999));
        const expira = new Date(Date.now() + 15 * 60 * 1000);

        await db.query(
            'UPDATE tokens_recuperacion SET usado = true WHERE usuario_id = $1 AND usado = false',
            [usuario.id]
        );
        await db.query(
            `INSERT INTO tokens_recuperacion (usuario_id, token, usado, expira_en) VALUES ($1, $2, false, $3)`,
            [usuario.id, hashCode(codigo), expira]
        );

        try {
            await sendPasswordChangeCodeEmail(usuario.email, usuario.nombre, codigo);
        } catch (mailErr) {
            console.error(mailErr);
            return res.status(500).json({
                success: false,
                message: mailErr.message || 'No se pudo enviar el correo'
            });
        }

        res.json({
            success: true,
            message: `Código enviado a ${usuario.email}. Revisa bandeja y spam (válido 15 min).`
        });
    } catch (error) {
        console.error('Error solicitar código cambio password:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

/** Login / registro con Google Identity Services (credential JWT) */
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ success: false, message: 'Credencial de Google requerida' });
        }
        if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
            return res.status(503).json({
                success: false,
                message: 'Google Sign-In no está configurado. Agrega GOOGLE_CLIENT_ID en backend/.env'
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            return res.status(401).json({ success: false, message: 'Cuenta de Google no verificada' });
        }

        const email = String(payload.email).trim().toLowerCase();
        const googleId = payload.sub;
        const nombre = payload.given_name || payload.name?.split(/\s+/)[0] || 'Cliente';
        const apellido = payload.family_name || payload.name?.split(/\s+/).slice(1).join(' ') || 'Google';

        let userRes;
        try {
            userRes = await db.query(
                'SELECT * FROM usuarios WHERE email = $1 OR google_id = $2',
                [email, googleId]
            );
        } catch {
            userRes = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        }
        let usuario = userRes.rows[0];
        let esNuevo = false;

        if (usuario) {
            if (usuario.activo === false) {
                return res.status(403).json({ success: false, message: 'Cuenta desactivada. Contacta al administrador.' });
            }
            if (!usuario.google_id) {
                await db.query(
                    `UPDATE usuarios
                     SET google_id = $1,
                         auth_provider = CASE WHEN auth_provider = 'local' THEN 'local+google' ELSE 'google' END,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [googleId, usuario.id]
                );
                usuario.google_id = googleId;
            }
        } else {
            const insert = await db.query(
                `INSERT INTO usuarios (nombre, apellido, email, password, google_id, auth_provider, rol)
                 VALUES ($1, $2, $3, NULL, $4, 'google', 'cliente')
                 RETURNING id, nombre, apellido, email, rol, activo, google_id, auth_provider`,
                [nombre, apellido, email, googleId]
            );
            usuario = insert.rows[0];
            esNuevo = true;
        }

        const token = signToken(usuario);
        const telefono = usuario.telefono || '';
        const perfilIncompleto = !String(telefono).trim()
            || !String(usuario.apellido || '').trim()
            || String(usuario.apellido).toLowerCase() === 'google';
        sendQuiet(sendWelcomeEmail(usuario.email, usuario.nombre, { firstTime: esNuevo }));
        res.json({
            success: true,
            message: 'Sesión con Google iniciada',
            token,
            esNuevo,
            perfilIncompleto: Boolean(esNuevo || perfilIncompleto),
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                telefono,
                rol: usuario.rol,
                auth_provider: usuario.auth_provider || 'google'
            }
        });
    } catch (error) {
        console.error('Error en googleLogin:', error);
        res.status(401).json({ success: false, message: 'No se pudo validar la sesión de Google' });
    }
};

module.exports = {
    login,
    registro,
    perfil,
    actualizarPerfil,
    solicitarRecuperacion,
    resetPassword,
    cambiarPassword,
    solicitarCodigoCambioPassword,
    googleLogin
};
