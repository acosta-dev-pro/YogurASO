const jwt = require('jsonwebtoken');
const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'Token requerido' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verified;
        next();
    } catch (error) {
        res.status(403).json({ success: false, message: 'Token inválido' });
    }
};
const verificarAdmin = (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ success: false, message: 'No autenticado' });
    if (req.usuario.rol !== 'admin') return res.status(403).json({ success: false, message: 'Acceso denegado' });
    next();
};
module.exports = { verificarToken, verificarAdmin };
