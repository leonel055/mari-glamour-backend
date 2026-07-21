const { Router } = require('express');
const {
  crearProducto,
  listarProductos,
  editarProducto,
  eliminarProducto,
} = require('../controllers/producto.controller');

const router = Router();

router.post('/', crearProducto);
router.get('/', listarProductos);
router.put('/:id', editarProducto);
router.delete('/:id', eliminarProducto);

module.exports = router;
