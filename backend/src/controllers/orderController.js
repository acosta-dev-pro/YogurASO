const db = require('../config/db');

const createOrder = async (req, res) => {
    try {
        const { direccion_envio, metodo_pago, items } = req.body;
        const usuario_id = req.usuario.id;
        if (!direccion_envio || !metodo_pago || !items || items.length === 0) return res.status(400).json({ success: false, message: 'Dirección, método de pago y items requeridos' });
        let total = 0;
        for (const item of items) {
            const product = await db.query('SELECT precio, stock FROM productos WHERE id =  AND activo = true', [item.producto_id]);
            if (product.rows.length === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            if (product.rows[0].stock < item.cantidad) return res.status(400).json({ success: false, message: 'Stock insuficiente' });
            total += product.rows[0].precio * item.cantidad;
        }
        const pedidoResult = await db.query('INSERT INTO pedidos (usuario_id, total, direccion_envio, metodo_pago) VALUES (, , , ) RETURNING id', [usuario_id, total, direccion_envio, metodo_pago]);
        const pedido_id = pedidoResult.rows[0].id;
        for (const item of items) {
            await db.query('INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (, , , (SELECT precio FROM productos WHERE id = ))', [pedido_id, item.producto_id, item.cantidad]);
            await db.query('UPDATE productos SET stock = stock -  WHERE id = ', [item.cantidad, item.producto_id]);
        }
        res.status(201).json({ success: true, message: 'Pedido creado', pedido_id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear pedido' });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const result = await db.query('SELECT p.*, json_agg(json_build_object(\'id\', dp.id, \'producto_id\', dp.producto_id, \'cantidad\', dp.cantidad, \'precio_unitario\', dp.precio_unitario, \'subtotal\', dp.subtotal, \'nombre\', pr.nombre)) as items FROM pedidos p LEFT JOIN detalle_pedido dp ON p.id = dp.pedido_id LEFT JOIN productos pr ON dp.producto_id = pr.id WHERE p.usuario_id =  GROUP BY p.id ORDER BY p.fecha DESC', [req.usuario.id]);
        res.json({ success: true, orders: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener pedidos' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const result = await db.query('SELECT p.*, u.nombre as usuario_nombre, u.email as usuario_email FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.fecha DESC');
        res.json({ success: true, orders: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener pedidos' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { estado } = req.body;
        const validEstados = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
        if (!validEstados.includes(estado)) return res.status(400).json({ success: false, message: 'Estado no válido' });
        const result = await db.query('UPDATE pedidos SET estado =  WHERE id =  RETURNING *', [estado, req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        res.json({ success: true, message: 'Estado actualizado', order: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar estado' });
    }
};

module.exports = { createOrder, getUserOrders, getAllOrders, updateOrderStatus };
