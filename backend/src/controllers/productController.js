const db = require('../config/db');

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

const getProducts = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
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
        const result = await db.query(
            'SELECT id, nombre, descripcion, precio, stock, imagen_url, categoria, activo FROM productos WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        res.json({ success: true, product: mapProduct(result.rows[0]) });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ success: false, message: 'Error al obtener producto' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, imagen_url, categoria, activo } = req.body;

        if (!nombre || precio === undefined || stock === undefined) {
            return res.status(400).json({ success: false, message: 'Nombre, precio y stock son requeridos' });
        }

        const result = await db.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria, activo)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, nombre, descripcion, precio, stock, imagen_url, categoria, activo`,
            [
                nombre.trim(),
                descripcion || null,
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
        const { nombre, descripcion, precio, stock, imagen_url, categoria, activo } = req.body;

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
                nombre?.trim(),
                descripcion || null,
                Number(precio),
                Number(stock),
                imagen_url || null,
                categoria || 'Yogur',
                activo === undefined ? true : Boolean(activo),
                req.params.id
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
        const result = await db.query(
            'DELETE FROM productos WHERE id = $1 RETURNING id',
            [req.params.id]
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
