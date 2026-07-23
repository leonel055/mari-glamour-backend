const { Router } = require('express');
const {
  crearProducto,
  listarProductos,
  obtenerProducto,
  editarProducto,
  eliminarProducto,
} = require('../controllers/producto.controller');

const router = Router();

router.post('/', crearProducto);
router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.put('/:id', editarProducto);
router.delete('/:id', eliminarProducto);

module.exports = router;
