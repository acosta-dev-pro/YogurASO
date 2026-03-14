const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { verificarToken, verificarAdmin } = require('../middleware/verifyToken');
router.post('/', verificarToken, createOrder);
router.get('/mis-pedidos', verificarToken, getUserOrders);
router.get('/', verificarToken, verificarAdmin, getAllOrders);
router.put('/:id/estado', verificarToken, verificarAdmin, updateOrderStatus);
module.exports = router;
