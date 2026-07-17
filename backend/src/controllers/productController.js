/**
 * productController.js — CRUD de productos (backend)
 * Listar, obtener por id, crear, actualizar y eliminar.
 * Los productos activos alimentan las cards del frontend.
 */
const db = require('../config/db');

/** Normaliza una fila de PostgreSQL al formato que usa el frontend */
const mapProduct = (row) => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    stock: row.stock,
    imagen_url: row.imagen_url,
    categoria: row.categoria,
    activo: row.activo
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

const getProducts = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';

        if (includeInactive) {
            if (!req.usuario || req.usuario.rol !== 'admin') {
                return res.status(403).json({ success: false, message: 'Acceso denegado', products: [] });
            }
        }

        const sql = includeInactive
            ? 'SELECT id, nombre, descripcion, precio, stock, imagen_url, categoria, activo FROM productos ORDER BY id DESC'
            : 'SELECT id, nombre, descripcion, precio, stock, imagen_url, categoria, activo FROM productos WHERE activo = true ORDER BY id DESC';

        const result = await db.query(sql);
        res.json({ success: true, products: result.rows.map(mapProduct) });
    } catch (error) {
        console.error('Error al listar productos:', error);
        res.status(500).json({ success: false, message: 'Error al listar productos', products: [] });
    }
};

const getProductById = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const result = await db.query(
            'SELECT id, nombre, descripcion, precio, stock, imagen_url, categoria, activo FROM productos WHERE id = $1',
            [id]
        );

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
        const validationError = validateProductPayload({ nombre, precio, stock });
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        const result = await db.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria, activo)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, nombre, descripcion, precio, stock, imagen_url, categoria, activo`,
            [
                String(nombre).trim(),
                descripcion ? String(descripcion).trim() : null,
                Number(precio),
                Number(stock),
                imagen_url || null,
                categoria || 'Yogur',
                activo === undefined ? true : Boolean(activo)
            ]
        );

        res.status(201).json({ success: true, message: 'Producto creado', product: mapProduct(result.rows[0]) });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { nombre, descripcion, precio, stock, imagen_url, categoria, activo } = req.body;
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
                 activo = $7
             WHERE id = $8
             RETURNING id, nombre, descripcion, precio, stock, imagen_url, categoria, activo`,
            [
                String(nombre).trim(),
                descripcion ? String(descripcion).trim() : null,
                Number(precio),
                Number(stock),
                imagen_url || null,
                categoria || 'Yogur',
                activo === undefined ? true : Boolean(activo),
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

        const result = await db.query(
            'DELETE FROM productos WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
