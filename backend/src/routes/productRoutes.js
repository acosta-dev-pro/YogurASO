/**
 * productRoutes.js — Rutas de productos
 * GET público (catálogo). POST/PUT/DELETE solo admin con JWT.
 */
const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { verificarToken, verificarAdmin, optionalAuth } = require('../middleware/verifyToken');

router.get('/', optionalAuth, getProducts);          // listar (includeInactive solo admin)
router.get('/:id', optionalAuth, getProductById);    // detalle
router.post('/', verificarToken, verificarAdmin, createProduct);
router.put('/:id', verificarToken, verificarAdmin, updateProduct);
router.delete('/:id', verificarToken, verificarAdmin, deleteProduct);

module.exports = router;
