/**
 * verifyToken.js
 * Lee el Bearer del header. Sin token no pasa. verificarAdmin mira el rol del JWT.
 */
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ success: false, message: 'Configuración de autenticación incompleta' });
        }
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verified;
        next();
    } catch (error) {
        res.status(403).json({ success: false, message: 'Token inválido o expirado' });
    }
};

const verificarAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }
    next();
};

const optionalAuth = (req, _res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token || !process.env.JWT_SECRET) {
        return next();
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        // Token inválido: continuar como anónimo
    }
    next();
};

module.exports = { verificarToken, verificarAdmin, optionalAuth };
