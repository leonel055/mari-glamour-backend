const { Router } = require('express');
const {
  crearServicio,
  listarServicios,
  editarServicio,
  eliminarServicio,
} = require('../controllers/servicio.controller');

const router = Router();

router.post('/', crearServicio);
router.get('/', listarServicios);
router.put('/:id', editarServicio);
router.delete('/:id', eliminarServicio);

module.exports = router;
