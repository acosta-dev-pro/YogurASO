const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const testRoutes = require('./src/routes/testRoutes');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer: almacenamiento de imágenes
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                   allowed.test(file.mimetype.split('/')[1]);
        cb(ok ? null : new Error('Solo se permiten imágenes'), ok);
    }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Servir archivos subidos como estáticos
app.use('/uploads', express.static(uploadsDir));

// RUTAS PRINCIPALES
app.get('/', (req, res) => {
    res.json({ success: true, message: 'API YogurASO funcionando' });
});

app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() as server_time');
        res.json({ success: true, database: 'connected', time: result.rows[0].server_time });
    } catch (error) {
        res.status(500).json({ success: false, database: 'disconnected', error: error.message });
    }
});

// UPLOAD DE IMÁGENES
app.post('/api/upload', upload.single('imagen'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
    const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ success: true, url });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/test', testRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor en http://localhost:' + PORT);
});

(async () => {
    try {
        await db.query('SELECT NOW()');
        console.log('Conectado a PostgreSQL');
        const count = await db.query('SELECT COUNT(*) FROM productos');
        console.log('Total productos en BD:', count.rows[0].count);
    } catch (error) {
        console.error('Error BD:', error);
    }
})();
