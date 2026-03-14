const db = require('../config/db');

const getProducts = async (req, res) => {
    try {
        const result = await db.query('SELECT p.*, c.nombre as categoria FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.activo = true ORDER BY p.id DESC');
        res.json({ success: true, count: result.rows.length, products: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener productos' });
    }
};

const getProduct = async (req, res) => {
    try {
        const result = await db.query('SELECT p.*, c.nombre as categoria FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = ', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        res.json({ success: true, product: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener producto' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoria_id, imagen_url } = req.body;
        if (!nombre || !precio) return res.status(400).json({ success: false, message: 'Nombre y precio requeridos' });
        const result = await db.query('INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, imagen_url) VALUES (, , , , , ) RETURNING *', [nombre, descripcion || '', precio, stock || 0, categoria_id || null, imagen_url || null]);
        res.status(201).json({ success: true, message: 'Producto creado', product: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoria_id, imagen_url, activo } = req.body;
        const result = await db.query('UPDATE productos SET nombre = COALESCE(, nombre), descripcion = COALESCE(, descripcion), precio = COALESCE(, precio), stock = COALESCE(, stock), categoria_id = COALESCE(, categoria_id), imagen_url = COALESCE(, imagen_url), activo = COALESCE(, activo) WHERE id =  RETURNING *', [nombre, descripcion, precio, stock, categoria_id, imagen_url, activo, req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        res.json({ success: true, message: 'Producto actualizado', product: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const result = await db.query('UPDATE productos SET activo = false WHERE id =  RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
