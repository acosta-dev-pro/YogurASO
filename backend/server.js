/**
 * server.js — Punto de entrada del backend YogurASO (Express)
 * -----------------------------------------------------------
 * Aquí se montan:
 *  - Helmet, CORS, JSON, rate limit
 *  - Upload de imágenes (solo admin)
 *  - Rutas /api/auth, /api/products y /api/users
 *  - Archivos estáticos de /uploads
 *
 * Frontend y backend corren por separado.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

dotenv.config({ path: path.join(__dirname, '.env') });

const requiredEnv = ['JWT_SECRET', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_HOST'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
    console.error('Faltan variables de entorno:', missingEnv.join(', '));
    process.exit(1);
}

const db = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const userRoutes = require('./src/routes/userRoutes');
const { verificarToken, verificarAdmin } = require('./src/middleware/verifyToken');
const { createRateLimiter } = require('./src/middleware/rateLimit');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:5501,http://127.0.0.1:5501,null')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = `img_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, safeName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedExt = /\.(jpeg|jpg|png|webp|gif)$/i;
        const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const ok = allowedExt.test(file.originalname) && allowedMime.includes(file.mimetype);
        cb(ok ? null : new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF'), ok);
    }
});

const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30, message: 'Demasiados intentos. Intenta de nuevo más tarde.' });
const uploadLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 40, message: 'Demasiadas subidas. Intenta de nuevo más tarde.' });

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // CSP apagada: el front carga Font Awesome, Google Fonts y el botón de Google
    contentSecurityPolicy: false
}));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        const enLocal = process.env.NODE_ENV !== 'production'
            && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
        if (enLocal) {
            return callback(null, true);
        }
        return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadsDir));

app.get('/', (_req, res) => {
    res.json({ success: true, message: 'API YogurASO funcionando' });
});

app.get('/api/health', async (_req, res) => {
    try {
        const result = await db.query('SELECT NOW() as server_time');
        res.json({ success: true, database: 'connected', time: result.rows[0].server_time });
    } catch (error) {
        res.status(500).json({ success: false, database: 'disconnected' });
    }
});

app.post(
    '/api/upload',
    uploadLimiter,
    verificarToken,
    verificarAdmin,
    (req, res, next) => {
        upload.single('imagen')(req, res, (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message || 'Error al subir archivo' });
            }
            next();
        });
    },
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
        }

        const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
        const url = `${baseUrl}/uploads/${req.file.filename}`;
        res.json({ success: true, url });
    }
);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
    if (err && err.message === 'Origen no permitido por CORS') {
        return res.status(403).json({ success: false, message: 'Origen no permitido' });
    }
    console.error('Error no controlado:', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
});

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor en http://localhost:' + PORT);
});

(async () => {
    try {
        await db.query('SELECT NOW()');
        console.log('Conectado a PostgreSQL');
        await db.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS letrero VARCHAR(40)');
        await db.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS letrero_tipo VARCHAR(20)');
        await db.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS descuento INTEGER DEFAULT 0');
        const count = await db.query('SELECT COUNT(*) FROM productos');
        console.log('Total productos en BD:', count.rows[0].count);
    } catch (error) {
        console.error('Error BD:', error.message);
    }
})();
