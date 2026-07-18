const { Router } = require('express');
const {
  crearCliente,
  listarClientes,
  editarCliente,
  eliminarCliente,
} = require('../controllers/cliente.controller');

const router = Router();

router.post('/', crearCliente);
router.get('/', listarClientes);
router.put('/:id', editarCliente);
router.delete('/:id', eliminarCliente);

module.exports = router;
