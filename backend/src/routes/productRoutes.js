const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { verificarToken, verificarAdmin } = require('../middleware/verifyToken');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', verificarToken, verificarAdmin, createProduct);
router.put('/:id', verificarToken, verificarAdmin, updateProduct);
router.delete('/:id', verificarToken, verificarAdmin, deleteProduct);

module.exports = router;
