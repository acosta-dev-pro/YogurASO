/**
 * productController.js
 * CRUD de productos. El catálogo (cards) solo pide los que están activos.
 */
const db = require('../config/db');

/** Normaliza una fila de PostgreSQL al formato que usa el frontend */
const mapProduct = (row) => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    stock: row.stock,
    imagen_url: row.imagen_url || row.imagen || '',
    categoria: row.categoria,
    letrero: row.letrero || '',
    letrero_tipo: row.letrero_tipo || '',
    descuento: Number(row.descuento || 0),
        activo: row.activo !== undefined ? Boolean(row.activo) : row.activo !== false
});

function parseId(raw) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) return null;
    return id;
}

function validateProductPayload({ nombre, precio, stock }, { partial = false } = {}) {
    if (!partial || nombre !== undefined) {
        if (!nombre || !String(nombre).trim()) {
            return 'El nombre es requerido';
        }
    }

    if (!partial || precio !== undefined) {
        const precioNum = Number(precio);
        if (!Number.isFinite(precioNum) || precioNum < 0) {
            return 'Precio inválido';
        }
    }

    if (!partial || stock !== undefined) {
        const stockNum = Number(stock);
        if (!Number.isInteger(stockNum) || stockNum < 0) {
            return 'Stock inválido';
        }
    }

    return null;
}

function parseLetrero(body) {
    const tipo = String(body.letrero_tipo || '').trim().toLowerCase();
    let texto = String(body.letrero || '').trim().slice(0, 24);
    let desc = Number(body.descuento || 0);
    if (!Number.isFinite(desc) || desc < 0) desc = 0;
    if (desc > 80) desc = 80;

    const allowed = new Set(['nuevo', 'oferta', 'descuento', 'destacado']);
    if (!tipo || !allowed.has(tipo)) {
        return { letrero: null, letrero_tipo: null, descuento: Math.round(desc) };
    }

    if (!texto) {
        if (tipo === 'nuevo') texto = 'Nuevo';
        else if (tipo === 'oferta') texto = 'Oferta';
        else if (tipo === 'destacado') texto = 'Destacado';
        else if (tipo === 'descuento' && desc) texto = `-${Math.round(desc)}%`;
        else if (tipo === 'descuento') texto = 'Descuento';
    }

    return { letrero: texto || null, letrero_tipo: tipo, descuento: Math.round(desc) };
}

const getProducts = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const user = req.usuario;

        if (includeInactive && (!user || user.rol !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Acceso denegado', products: [] });
        }

        const result = await db.query('SELECT * FROM productos ORDER BY id DESC');
        let rows = result.rows;
        if (!includeInactive) {
            rows = rows.filter((r) => r.activo !== false);
        }
        res.json({ success: true, products: rows.map(mapProduct) });
    } catch (error) {
        console.error('Error al listar productos:', error);
        try {
            const includeInactive =
                req.query.includeInactive === 'true' || req.query.includeInactive === 'true';
            const fallback = await db.query(
                includeInactive
                    ? 'SELECT * FROM productos ORDER BY id DESC'
                    : 'SELECT * FROM productos WHERE activo = true ORDER BY id DESC'
            );
            return res.json({ success: true, products: fallback.rows.map(mapProduct) });
        } catch (err2) {
            console.error('Error al listar productos (fallback):', err2);
            return res.status(500).json({ success: false, message: 'Error al listar productos', products: [] });
        }
    }
};

const getProductById = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const result = await db.query('SELECT * FROM productos WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        const product = mapProduct(result.rows[0]);
        if (!product.activo && (!req.usuario || req.usuario.rol !== 'admin')) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ success: false, message: 'Error al obtener producto' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, imagen_url, categoria, activo } = req.body;
        const tag = parseLetrero(req.body);
        const validationError = validateProductPayload({ nombre, precio, stock });
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const result = await db.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria, activo, letrero, letrero_tipo, descuento)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id, nombre, descripcion, precio, stock, imagen_url, categoria, activo, letrero, letrero_tipo, descuento`,
            [
                String(nombre).trim(),
                descripcion ? String(descripcion).trim() : null,
                Number(precio),
                Number(stock),
                imagen_url || null,
                categoria || 'Yogur',
                activo === undefined ? true : Boolean(activo),
                tag.letrero,
                tag.letrero_tipo,
                tag.descuento
            ]
        );

        res.status(201).json({ success: true, message: 'Producto creado', product: mapProduct(result.rows[0]) });
    } catch (error) {
        console.error('Error al crear producto:', error);
        const hint = /letrero|descuento/i.test(String(error.message || ''))
            ? ' Falta migración de letreros en la base de datos.'
            : '';
        res.status(500).json({ success: false, message: `Error al crear producto.${hint}` });
    }
};

const updateProduct = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { nombre, descripcion, precio, stock, imagen_url, categoria, activo } = req.body;
        const tag = parseLetrero(req.body);
        const validationError = validateProductPayload({ nombre, precio, stock });
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const result = await db.query(
            `UPDATE productos
             SET nombre = $1,
                 descripcion = $2,
                 precio = $3,
                 stock = $4,
                 imagen_url = $5,
                 categoria = $6,
                 activo = $7,
                 letrero = $8,
                 letrero_tipo = $9,
                 descuento = $10
             WHERE id = $11
             RETURNING id, nombre, descripcion, precio, stock, imagen_url, categoria, activo, letrero, letrero_tipo, descuento`,
            [
                String(nombre).trim(),
                descripcion ? String(descripcion).trim() : null,
                Number(precio),
                Number(stock),
                imagen_url || null,
                categoria || 'Yogur',
                activo === undefined ? true : Boolean(activo),
                tag.letrero,
                tag.letrero_tipo,
                tag.descuento,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        res.json({ success: true, message: 'Producto actualizado', product: mapProduct(result.rows[0]) });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Soft-delete: desactiva en lugar de borrar (conserva historial)
        const result = await db.query(
            `UPDATE productos SET activo = false, updated_at = NOW()
             WHERE id = $1
             RETURNING id, activo`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        res.json({ success: true, message: 'Producto desactivado (soft-delete)' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
