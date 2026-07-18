const { Router } = require('express');
const {
  crearTurno,
  listarTurnos,
  editarTurno,
  cancelarTurno,
  horariosDisponibles,
} = require('../controllers/turno.controller');

const router = Router();

router.get('/disponibles', horariosDisponibles);
router.post('/', crearTurno);
router.get('/', listarTurnos);
router.put('/:id', editarTurno);
router.patch('/:id/cancelar', cancelarTurno);

module.exports = router;
